/**
 * Agent专属任务调度器
 * 负责管理Agent内部任务的定时执行
 */

import * as cron from "node-cron";
import { Logger } from "../log.mjs";
import type { Task } from "@dadigua/hyperchat-shared";

export class AgentTaskScheduler {
  private taskJobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning: boolean = false;
  private agentName: string;
  private getTasksFunc: () => Promise<Task[]>;
  private executeTaskFunc: (taskName: string) => Promise<void>;

  constructor(
    agentName: string,
    getTasksFunc: () => Promise<Task[]>,
    executeTaskFunc: (taskName: string) => Promise<void>
  ) {
    this.agentName = agentName;
    this.getTasksFunc = getTasksFunc;
    this.executeTaskFunc = executeTaskFunc;
  }

  /**
   * 启动任务调度器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      Logger.info(`Agent ${this.agentName} 任务调度器已在运行中`);
      return;
    }

    try {
      Logger.info(`启动Agent ${this.agentName} 任务调度器...`);
      
      // 获取所有启用的任务
      const tasks = await this.getTasksFunc();
      const enabledTasks = tasks.filter(task => !task.disabled && task.cron);
      
      if (enabledTasks.length === 0) {
        Logger.info(`Agent ${this.agentName} 没有启用的定时任务`);
        this.isRunning = true;
        return;
      }

      // 为每个任务创建cron作业
      for (const task of enabledTasks) {
        await this.scheduleTask(task.name, task.cron);
      }

      this.isRunning = true;
      Logger.info(`Agent ${this.agentName} 任务调度器已启动，共加载 ${enabledTasks.length} 个任务`);
    } catch (error) {
      Logger.error(`启动Agent ${this.agentName} 任务调度器失败:`, error);
      throw error;
    }
  }

  /**
   * 停止任务调度器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      Logger.info(`停止Agent ${this.agentName} 任务调度器...`);
      
      // 停止所有任务
      for (const [taskName, job] of this.taskJobs.entries()) {
        job.stop();
        Logger.info(`Agent ${this.agentName} 停止任务: ${taskName}`);
      }
      
      this.taskJobs.clear();
      this.isRunning = false;
      Logger.info(`Agent ${this.agentName} 任务调度器已停止`);
    } catch (error) {
      Logger.error(`停止Agent ${this.agentName} 任务调度器失败:`, error);
      throw error;
    }
  }

  /**
   * 重启任务调度器
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * 调度单个任务
   */
  async scheduleTask(taskName: string, cronExpression: string): Promise<void> {
    try {
      // 如果任务已经被调度，先停止它
      if (this.taskJobs.has(taskName)) {
        const existingJob = this.taskJobs.get(taskName)!;
        existingJob.stop();
        this.taskJobs.delete(taskName);
      }

      // 验证cron表达式
      if (!cron.validate(cronExpression)) {
        throw new Error(`无效的cron表达式: ${cronExpression}`);
      }

      // 创建新的cron作业
      const job = cron.schedule(cronExpression, async () => {
        await this.executeTask(taskName);
      }, {
        scheduled: false, // 先不启动，等设置完成后再启动
        timezone: 'Asia/Shanghai' // 使用中国时区
      });

      // 启动作业
      job.start();
      this.taskJobs.set(taskName, job);
      
      Logger.info(`Agent ${this.agentName} 任务 '${taskName}' 已调度，执行时间: ${cronExpression}`);
    } catch (error) {
      Logger.error(`Agent ${this.agentName} 调度任务 '${taskName}' 失败:`, error);
      throw error;
    }
  }

  /**
   * 取消调度单个任务
   */
  async unscheduleTask(taskName: string): Promise<void> {
    const job = this.taskJobs.get(taskName);
    if (job) {
      job.stop();
      this.taskJobs.delete(taskName);
      Logger.info(`Agent ${this.agentName} 取消调度任务: ${taskName}`);
    }
  }

  /**
   * 执行单个任务
   */
  async executeTask(taskName: string): Promise<void> {
    try {
      Logger.info(`Agent ${this.agentName} 开始执行任务: ${taskName}`);
      await this.executeTaskFunc(taskName);
      Logger.info(`Agent ${this.agentName} 任务执行完成: ${taskName}`);
    } catch (error) {
      Logger.error(`Agent ${this.agentName} 执行任务 '${taskName}' 失败:`, error);
      throw error;
    }
  }

  /**
   * 手动触发任务
   */
  async triggerTask(taskName: string): Promise<void> {
    Logger.info(`Agent ${this.agentName} 手动触发任务: ${taskName}`);
    await this.executeTask(taskName);
  }

  /**
   * 获取当前调度的任务列表
   */
  getScheduledTasks(): string[] {
    return Array.from(this.taskJobs.keys());
  }

  /**
   * 检查任务是否正在调度中
   */
  isTaskScheduled(taskName: string): boolean {
    return this.taskJobs.has(taskName);
  }

  /**
   * 检查调度器是否正在运行
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 更新任务调度（当任务配置改变时调用）
   */
  async updateTaskSchedule(taskName: string, task: Task, oldTaskName?: string): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // 如果任务名称改变了，需要取消旧的调度
    if (oldTaskName && oldTaskName !== taskName) {
      await this.unscheduleTask(oldTaskName);
    }

    // 重新调度任务
    if (!task.disabled && task.cron) {
      await this.scheduleTask(task.name, task.cron);
    } else {
      await this.unscheduleTask(task.name);
    }
  }

  /**
   * 删除任务调度
   */
  async deleteTaskSchedule(taskName: string): Promise<void> {
    if (this.isRunning) {
      await this.unscheduleTask(taskName);
    }
  }

  /**
   * 启用任务调度
   */
  async enableTaskSchedule(taskName: string, cronExpression: string): Promise<void> {
    if (this.isRunning) {
      await this.scheduleTask(taskName, cronExpression);
    }
  }

  /**
   * 禁用任务调度
   */
  async disableTaskSchedule(taskName: string): Promise<void> {
    if (this.isRunning) {
      await this.unscheduleTask(taskName);
    }
  }

  /**
   * 获取调度器统计信息
   */
  getStats(): {
    running: boolean;
    scheduledTasksCount: number;
    scheduledTasks: string[];
  } {
    return {
      running: this.isRunning,
      scheduledTasksCount: this.taskJobs.size,
      scheduledTasks: this.getScheduledTasks(),
    };
  }
}