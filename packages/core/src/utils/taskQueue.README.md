# TaskQueue - 异步任务队列

一个功能强大的异步任务队列实现，支持可配置的并发数量、任务优先级、错误处理和重试机制。

## 特性

- 🚀 **可配置并发数量**: 支持设置并发执行的任务数量（默认为1，确保顺序执行）
- 📋 **任务优先级**: 支持任务优先级，数值越小优先级越高
- 🔄 **错误处理**: 支持多种错误处理策略（停止、继续、重试）
- ⏱️ **超时控制**: 支持任务执行超时控制
- ⏸️ **队列控制**: 支持暂停、恢复、清空队列
- 📊 **统计信息**: 提供详细的队列运行统计信息
- 🔍 **任务监控**: 支持查看队列和运行中任务的详细信息

## 快速开始

### 基本使用

```typescript
import { TaskQueue } from './taskQueue.mjs';

// 创建一个顺序执行的队列（并发数为1）
const queue = new TaskQueue({ concurrency: 1 });

// 添加任务
const result = await queue.add(async () => {
    console.log('执行任务');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return '任务结果';
});

console.log(result); // '任务结果'
```

### 并发执行

```typescript
// 创建一个支持3个并发的队列
const concurrentQueue = new TaskQueue({ concurrency: 3 });

// 添加多个任务，它们会并发执行
const tasks = Array.from({ length: 5 }, (_, i) =>
    concurrentQueue.add(async () => {
        console.log(`任务${i + 1}开始`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `任务${i + 1}完成`;
    })
);

const results = await Promise.all(tasks);
```

### 任务优先级

```typescript
const queue = new TaskQueue({ concurrency: 1 });

// 数值越小优先级越高
const lowPriorityTask = queue.add(async () => '低优先级', 10);
const highPriorityTask = queue.add(async () => '高优先级', 1);
const mediumPriorityTask = queue.add(async () => '中优先级', 5);

// 执行顺序：高优先级 → 中优先级 → 低优先级
```

### 错误处理和重试

```typescript
const queue = new TaskQueue({
    concurrency: 1,
    errorStrategy: 'retry',  // 重试策略
    retryCount: 3           // 最多重试3次
});

await queue.add(async () => {
    // 模拟可能失败的任务
    if (Math.random() < 0.7) {
        throw new Error('任务失败');
    }
    return '任务成功';
});
```

### 超时控制

```typescript
const queue = new TaskQueue({
    concurrency: 1,
    timeout: 5000  // 5秒超时
});

try {
    await queue.add(async () => {
        // 长时间运行的任务
        await new Promise(resolve => setTimeout(resolve, 10000));
        return '完成';
    });
} catch (error) {
    console.log('任务超时');
}
```

### 批量任务

```typescript
const queue = new TaskQueue({ concurrency: 2 });

const batchTasks = [
    { task: async () => '任务1', priority: 1 },
    { task: async () => '任务2', priority: 5 },
    { task: async () => '任务3', priority: 3 }
];

const results = await queue.addBatch(batchTasks);
```

### 队列控制

```typescript
const queue = new TaskQueue({ concurrency: 1 });

// 暂停队列
queue.pause();

// 恢复队列
queue.resume();

// 清空队列（不影响正在运行的任务）
queue.clear();

// 等待所有任务完成
await queue.drain();

// 停止队列并清理所有任务
await queue.stop();
```

### 队列统计

```typescript
const queue = new TaskQueue({ concurrency: 2 });

// 获取统计信息
const stats = queue.getStats();
console.log(stats);
// {
//   pending: 5,      // 等待中的任务数
//   running: 2,      // 正在执行的任务数
//   completed: 10,   // 已完成的任务数
//   failed: 1,       // 失败的任务数
//   active: true     // 队列是否活跃
// }

// 获取队列详细信息
const queueInfo = queue.getQueueInfo();
const runningInfo = queue.getRunningInfo();
```

### 动态调整并发数

```typescript
const queue = new TaskQueue({ concurrency: 1 });

// 动态调整并发数
queue.setConcurrency(4);

console.log(queue.getConcurrency()); // 4
```

## 预定义队列

为了方便使用，提供了两个预定义的全局队列：

```typescript
import { defaultTaskQueue, multiThreadQueue } from './taskQueue.mjs';

// 默认顺序队列（并发数为1）
await defaultTaskQueue.add(async () => '顺序执行的任务');

// 多线程队列（并发数为4）
await multiThreadQueue.add(async () => '并发执行的任务');
```

## 配置选项

```typescript
interface TaskQueueOptions {
  /** 并发数量，默认为1（顺序执行） */
  concurrency?: number;
  
  /** 任务超时时间（毫秒），默认无超时 */
  timeout?: number;
  
  /** 错误处理策略 */
  errorStrategy?: 'stop' | 'continue' | 'retry';
  
  /** 重试次数（当errorStrategy为retry时） */
  retryCount?: number;
}
```

### 错误处理策略

- **`stop`**: 遇到错误时停止整个队列，所有待处理任务都会被拒绝
- **`continue`**: 遇到错误时继续处理其他任务（默认）
- **`retry`**: 遇到错误时重试任务，直到达到最大重试次数

## 应用场景

1. **文件处理**: 批量处理文件时控制并发数，避免资源耗尽
2. **API调用**: 控制对外部API的并发请求数量
3. **数据库操作**: 控制数据库操作的并发度
4. **任务调度**: 按优先级和顺序执行任务
5. **资源密集型操作**: 限制CPU或内存密集型任务的并发数

## 测试和示例

运行测试：
```bash
npx tsx src/utils/taskQueue.test.mts
```

运行示例：
```bash
npx tsx src/utils/taskQueue.example.mts
```

## 性能特点

- 使用 `Map` 和 `Array` 进行高效的任务管理
- 支持动态调整并发数量
- 内存占用低，适合长时间运行
- 支持任务优先级排序，自动维护执行顺序
- 提供详细的统计信息和监控能力