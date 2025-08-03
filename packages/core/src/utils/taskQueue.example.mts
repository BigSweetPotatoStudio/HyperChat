/**
 * TaskQueue 使用示例
 * 演示如何使用异步任务队列进行各种场景的任务管理
 */

import { TaskQueue, defaultTaskQueue, multiThreadQueue } from './taskQueue.mjs';

/**
 * 示例1: 基本使用 - 顺序执行任务
 */
async function basicUsageExample() {
  console.log('\n=== 基本使用示例 ===');
  
  const queue = new TaskQueue({ concurrency: 1 });
  
  // 添加一些任务
  const task1 = queue.add(async () => {
    console.log('任务1开始执行');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('任务1完成');
    return '任务1结果';
  });
  
  const task2 = queue.add(async () => {
    console.log('任务2开始执行');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('任务2完成');
    return '任务2结果';
  });
  
  const task3 = queue.add(async () => {
    console.log('任务3开始执行');
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('任务3完成');
    return '任务3结果';
  });
  
  // 等待所有任务完成
  const results = await Promise.all([task1, task2, task3]);
  console.log('所有任务结果:', results);
  
  console.log('队列统计:', queue.getStats());
}

/**
 * 示例2: 并发执行任务
 */
async function concurrentExample() {
  console.log('\n=== 并发执行示例 ===');
  
  const queue = new TaskQueue({ concurrency: 3 });
  
  const tasks = [];
  for (let i = 1; i <= 5; i++) {
    tasks.push(
      queue.add(async () => {
        console.log(`并发任务${i}开始执行`);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        console.log(`并发任务${i}完成`);
        return `并发任务${i}结果`;
      })
    );
  }
  
  const results = await Promise.all(tasks);
  console.log('并发任务结果:', results);
  console.log('队列统计:', queue.getStats());
}

/**
 * 示例3: 任务优先级
 */
async function priorityExample() {
  console.log('\n=== 任务优先级示例 ===');
  
  const queue = new TaskQueue({ concurrency: 1 });
  
  // 添加不同优先级的任务（数值越小优先级越高）
  const lowPriorityTask = queue.add(async () => {
    console.log('低优先级任务执行');
    await new Promise(resolve => setTimeout(resolve, 200));
    return '低优先级结果';
  }, 10);
  
  const highPriorityTask = queue.add(async () => {
    console.log('高优先级任务执行');
    await new Promise(resolve => setTimeout(resolve, 200));
    return '高优先级结果';
  }, 1);
  
  const mediumPriorityTask = queue.add(async () => {
    console.log('中优先级任务执行');
    await new Promise(resolve => setTimeout(resolve, 200));
    return '中优先级结果';
  }, 5);
  
  const results = await Promise.all([lowPriorityTask, highPriorityTask, mediumPriorityTask]);
  console.log('优先级任务结果:', results);
}

/**
 * 示例4: 错误处理和重试
 */
async function errorHandlingExample() {
  console.log('\n=== 错误处理示例 ===');
  
  const queue = new TaskQueue({ 
    concurrency: 1,
    errorStrategy: 'retry',
    retryCount: 2
  });
  
  let attemptCount = 0;
  
  try {
    await queue.add(async () => {
      attemptCount++;
      console.log(`尝试执行任务，第${attemptCount}次`);
      
      if (attemptCount < 3) {
        throw new Error(`模拟失败，第${attemptCount}次尝试`);
      }
      
      console.log('任务成功执行');
      return '成功结果';
    });
  } catch (error) {
    console.log('任务最终失败:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('队列统计:', queue.getStats());
}

/**
 * 示例5: 超时处理
 */
async function timeoutExample() {
  console.log('\n=== 超时处理示例 ===');
  
  const queue = new TaskQueue({ 
    concurrency: 1,
    timeout: 1000 // 1秒超时
  });
  
  try {
    await queue.add(async () => {
      console.log('开始执行长时间任务');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒任务
      return '长时间任务结果';
    });
  } catch (error) {
    console.log('任务超时:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('队列统计:', queue.getStats());
}

/**
 * 示例6: 批量任务处理
 */
async function batchExample() {
  console.log('\n=== 批量任务处理示例 ===');
  
  const queue = new TaskQueue({ concurrency: 2 });
  
  // 创建批量任务
  const batchTasks = Array.from({ length: 5 }, (_, i) => ({
    task: async () => {
      console.log(`批量任务${i + 1}执行`);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
      return `批量任务${i + 1}结果`;
    },
    priority: Math.floor(Math.random() * 10)
  }));
  
  const results = await queue.addBatch(batchTasks);
  console.log('批量任务结果:', results);
  console.log('队列统计:', queue.getStats());
}

/**
 * 示例7: 队列控制
 */
async function queueControlExample() {
  console.log('\n=== 队列控制示例 ===');
  
  const queue = new TaskQueue({ concurrency: 1 });
  
  // 添加任务
  const task1 = queue.add(async () => {
    console.log('任务1执行');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return '任务1结果';
  });
  
  const task2 = queue.add(async () => {
    console.log('任务2执行');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return '任务2结果';
  });
  
  // 暂停队列
  setTimeout(() => {
    console.log('暂停队列');
    queue.pause();
  }, 500);
  
  // 恢复队列
  setTimeout(() => {
    console.log('恢复队列');
    queue.resume();
  }, 1500);
  
  const results = await Promise.all([task1, task2]);
  console.log('控制队列结果:', results);
}

/**
 * 示例8: 使用预定义的全局队列
 */
async function globalQueueExample() {
  console.log('\n=== 全局队列示例 ===');
  
  // 使用默认的顺序队列
  const sequentialResult = await defaultTaskQueue.add(async () => {
    console.log('使用默认顺序队列');
    await new Promise(resolve => setTimeout(resolve, 300));
    return '顺序队列结果';
  });
  
  // 使用多线程队列
  const concurrentTasks = Array.from({ length: 3 }, (_, i) =>
    multiThreadQueue.add(async () => {
      console.log(`多线程任务${i + 1}执行`);
      await new Promise(resolve => setTimeout(resolve, 200));
      return `多线程任务${i + 1}结果`;
    })
  );
  
  const concurrentResults = await Promise.all(concurrentTasks);
  
  console.log('顺序队列结果:', sequentialResult);
  console.log('多线程队列结果:', concurrentResults);
  console.log('默认队列统计:', defaultTaskQueue.getStats());
  console.log('多线程队列统计:', multiThreadQueue.getStats());
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('开始运行TaskQueue示例...');
  
  try {
    await basicUsageExample();
    await concurrentExample();
    await priorityExample();
    await errorHandlingExample();
    await timeoutExample();
    await batchExample();
    await queueControlExample();
    await globalQueueExample();
    
    console.log('\n所有示例运行完成！');
  } catch (error) {
    console.error('示例运行出错:', error);
  }
}

// 如果直接运行此文件，则执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}