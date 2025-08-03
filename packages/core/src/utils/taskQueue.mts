/**
 * 异步任务队列
 * 支持可配置的并发数量，用于控制任务执行顺序和并发度
 */

export interface TaskQueueOptions {
  /** 并发数量，默认为1（顺序执行） */
  concurrency?: number;
  /** 任务超时时间（毫秒），默认无超时 */
  timeout?: number;
  /** 错误处理策略 */
  errorStrategy?: 'stop' | 'continue' | 'retry';
  /** 重试次数（当errorStrategy为retry时） */
  retryCount?: number;
}

export interface QueuedTask<T = any> {
  /** 任务ID */
  id: string;
  /** 任务函数 */
  task: () => Promise<T>;
  /** 任务优先级，数值越小优先级越高 */
  priority?: number;
  /** 任务创建时间 */
  createdAt: number;
  /** 解决Promise的函数 */
  resolve: (value: T) => void;
  /** 拒绝Promise的函数 */
  reject: (error: Error) => void;
  /** 重试计数 */
  retryCount: number;
}

export interface TaskQueueStats {
  /** 队列中等待的任务数量 */
  pending: number;
  /** 正在执行的任务数量 */
  running: number;
  /** 已完成的任务数量 */
  completed: number;
  /** 失败的任务数量 */
  failed: number;
  /** 队列是否处于活动状态 */
  active: boolean;
}

/**
 * 异步任务队列类
 * 模拟线程池，支持并发控制和任务优先级
 */
export class TaskQueue {
  private queue: QueuedTask[] = [];
  private running: Map<string, QueuedTask> = new Map();
  private options: Required<TaskQueueOptions>;
  private stats = {
    completed: 0,
    failed: 0
  };
  private isActive = true;
  private taskIdCounter = 0;

  constructor(options: TaskQueueOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? 1,
      timeout: options.timeout ?? 0,
      errorStrategy: options.errorStrategy ?? 'continue',
      retryCount: options.retryCount ?? 0
    };
  }

  /**
   * 添加任务到队列
   */
  async add<T>(task: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;
      
      const queuedTask: QueuedTask<T> = {
        id: taskId,
        task,
        priority,
        createdAt: Date.now(),
        resolve,
        reject,
        retryCount: 0
      };

      // 按优先级插入队列（优先级数值越小越优先）
      const insertIndex = this.queue.findIndex(t => (t.priority ?? 0) > priority);
      if (insertIndex === -1) {
        this.queue.push(queuedTask);
      } else {
        this.queue.splice(insertIndex, 0, queuedTask);
      }

      this.processQueue();
    });
  }

  /**
   * 批量添加任务
   */
  async addBatch<T>(tasks: Array<{ task: () => Promise<T>; priority?: number }>): Promise<T[]> {
    const promises = tasks.map(({ task, priority }) => this.add(task, priority));
    return Promise.all(promises);
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    // 如果已达到并发限制，则等待
    if (this.running.size >= this.options.concurrency) {
      return;
    }

    // 获取下一个任务
    const nextTask = this.queue.shift();
    if (!nextTask) {
      return;
    }

    // 标记为正在运行
    this.running.set(nextTask.id, nextTask);

    try {
      await this.executeTask(nextTask);
    } catch (error) {
      // 错误已在executeTask中处理
    } finally {
      // 从运行中移除
      this.running.delete(nextTask.id);
      
      // 继续处理队列
      this.processQueue();
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask<T>(queuedTask: QueuedTask<T>): Promise<void> {
    try {
      let result: T;

      if (this.options.timeout > 0) {
        // 带超时的任务执行
        result = await Promise.race([
          queuedTask.task(),
          this.createTimeoutPromise<T>(this.options.timeout)
        ]);
      } else {
        // 无超时的任务执行
        result = await queuedTask.task();
      }

      this.stats.completed++;
      queuedTask.resolve(result);
    } catch (error) {
      await this.handleTaskError(queuedTask, error as Error);
    }
  }

  /**
   * 处理任务错误
   */
  private async handleTaskError<T>(queuedTask: QueuedTask<T>, error: Error): Promise<void> {
    const shouldRetry = this.options.errorStrategy === 'retry' && 
                       queuedTask.retryCount < this.options.retryCount;

    if (shouldRetry) {
      queuedTask.retryCount++;
      // 重新加入队列
      this.queue.unshift(queuedTask);
      return;
    }

    this.stats.failed++;

    if (this.options.errorStrategy === 'stop') {
      // 停止队列并拒绝所有待处理任务
      this.isActive = false;
      this.rejectAllPendingTasks(error);
    }

    queuedTask.reject(error);
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 拒绝所有待处理任务
   */
  private rejectAllPendingTasks(error: Error): void {
    // 拒绝队列中的任务
    for (const task of this.queue) {
      task.reject(new Error(`Queue stopped due to error: ${error.message}`));
    }
    this.queue = [];

    // 拒绝正在运行的任务（它们会自然完成或失败）
    // 这里不需要特殊处理，因为它们已经在执行中
  }

  /**
   * 暂停队列
   */
  pause(): void {
    this.isActive = false;
  }

  /**
   * 恢复队列
   */
  resume(): void {
    this.isActive = true;
    this.processQueue();
  }

  /**
   * 清空队列（不影响正在运行的任务）
   */
  clear(): void {
    for (const task of this.queue) {
      task.reject(new Error('Queue cleared'));
    }
    this.queue = [];
  }

  /**
   * 等待所有任务完成
   */
  async drain(): Promise<void> {
    return new Promise((resolve) => {
      const checkEmpty = () => {
        if (this.queue.length === 0 && this.running.size === 0) {
          resolve();
        } else {
          setTimeout(checkEmpty, 10);
        }
      };
      checkEmpty();
    });
  }

  /**
   * 强制停止队列并清理所有任务
   */
  async stop(): Promise<void> {
    this.isActive = false;
    this.clear();
    
    // 等待正在运行的任务完成（最多等待30秒）
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (this.running.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 获取队列统计信息
   */
  getStats(): TaskQueueStats {
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: this.stats.completed,
      failed: this.stats.failed,
      active: this.isActive
    };
  }

  /**
   * 获取当前并发数
   */
  getConcurrency(): number {
    return this.options.concurrency;
  }

  /**
   * 动态设置并发数
   */
  setConcurrency(concurrency: number): void {
    if (concurrency < 1) {
      throw new Error('Concurrency must be at least 1');
    }
    
    this.options.concurrency = concurrency;
    
    // 如果增加了并发数，立即处理队列
    if (this.isActive) {
      this.processQueue();
    }
  }

  /**
   * 获取队列中任务的详细信息
   */
  getQueueInfo(): Array<{id: string; priority: number; createdAt: number}> {
    return this.queue.map(task => ({
      id: task.id,
      priority: task.priority ?? 0,
      createdAt: task.createdAt
    }));
  }

  /**
   * 获取正在运行任务的详细信息
   */
  getRunningInfo(): Array<{id: string; priority: number; createdAt: number}> {
    return Array.from(this.running.values()).map(task => ({
      id: task.id,
      priority: task.priority ?? 0,
      createdAt: task.createdAt
    }));
  }
}

/**
 * 创建一个全局单例任务队列
 */
export function createTaskQueue(options?: TaskQueueOptions): TaskQueue {
  return new TaskQueue(options);
}

/**
 * 默认的全局任务队列实例（并发数为1，确保顺序执行）
 */
export const defaultTaskQueue = new TaskQueue({ concurrency: 1 });

/**
 * 多线程模拟任务队列实例（并发数为4）
 */
export const multiThreadQueue = new TaskQueue({ concurrency: 4 });