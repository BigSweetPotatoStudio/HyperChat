/**
 * TaskQueue 单元测试
 */

import { TaskQueue } from './taskQueue.mjs';

/**
 * 测试基本功能
 */
async function testBasicFunctionality() {
  console.log('测试基本功能...');
  
  const queue = new TaskQueue({ concurrency: 1 });
  const results: string[] = [];
  
  // 添加任务
  const promises = [
    queue.add(async () => {
      results.push('task1');
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'result1';
    }),
    queue.add(async () => {
      results.push('task2');
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'result2';
    }),
    queue.add(async () => {
      results.push('task3');
      await new Promise(resolve => setTimeout(resolve, 75));
      return 'result3';
    })
  ];
  
  const taskResults = await Promise.all(promises);
  
  // 验证任务按顺序执行
  if (results.join(',') === 'task1,task2,task3') {
    console.log('✅ 任务顺序执行测试通过');
  } else {
    console.log('❌ 任务顺序执行测试失败:', results);
  }
  
  // 验证返回结果
  if (taskResults.join(',') === 'result1,result2,result3') {
    console.log('✅ 任务结果测试通过');
  } else {
    console.log('❌ 任务结果测试失败:', taskResults);
  }
}

/**
 * 测试并发功能
 */
async function testConcurrency() {
  console.log('测试并发功能...');
  
  const queue = new TaskQueue({ concurrency: 3 });
  const startTimes: number[] = [];
  const endTimes: number[] = [];
  
  const promises = Array.from({ length: 5 }, (_, i) =>
    queue.add(async () => {
      const startTime = Date.now();
      startTimes.push(startTime);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const endTime = Date.now();
      endTimes.push(endTime);
      
      return `task${i + 1}`;
    })
  );
  
  await Promise.all(promises);
  
  // 验证前3个任务应该几乎同时开始
  const firstThreeStarts = startTimes.slice(0, 3);
  const maxStartDiff = Math.max(...firstThreeStarts) - Math.min(...firstThreeStarts);
  
  if (maxStartDiff < 50) {
    console.log('✅ 并发执行测试通过');
  } else {
    console.log('❌ 并发执行测试失败，时间差:', maxStartDiff);
  }
}

/**
 * 测试优先级功能
 */
async function testPriority() {
  console.log('测试优先级功能...');
  
  const queue = new TaskQueue({ concurrency: 1 });
  const executionOrder: number[] = [];
  
  // 添加一个正在执行的任务
  const runningTask = queue.add(async () => {
    executionOrder.push(0);
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'running';
  });
  
  // 等待一点时间确保第一个任务开始执行
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // 添加不同优先级的任务
  const lowPriorityTask = queue.add(async () => {
    executionOrder.push(3);
    return 'low';
  }, 10);
  
  const highPriorityTask = queue.add(async () => {
    executionOrder.push(1);
    return 'high';
  }, 1);
  
  const mediumPriorityTask = queue.add(async () => {
    executionOrder.push(2);
    return 'medium';
  }, 5);
  
  await Promise.all([runningTask, lowPriorityTask, highPriorityTask, mediumPriorityTask]);
  
  // 验证执行顺序：running(0), high(1), medium(2), low(3)
  if (executionOrder.join(',') === '0,1,2,3') {
    console.log('✅ 优先级测试通过');
  } else {
    console.log('❌ 优先级测试失败，执行顺序:', executionOrder);
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  console.log('测试错误处理...');
  
  const queue = new TaskQueue({ 
    concurrency: 1,
    errorStrategy: 'continue'
  });
  
  let errorCaught = false;
  let successfulTaskCompleted = false;
  
  // 添加一个会失败的任务
  const failingTask = queue.add(async () => {
    throw new Error('测试错误');
  }).catch(() => {
    errorCaught = true;
  });
  
  // 添加一个成功的任务
  const successTask = queue.add(async () => {
    successfulTaskCompleted = true;
    return 'success';
  });
  
  await Promise.all([failingTask, successTask]);
  
  if (errorCaught && successfulTaskCompleted) {
    console.log('✅ 错误处理测试通过');
  } else {
    console.log('❌ 错误处理测试失败');
  }
}

/**
 * 测试重试功能
 */
async function testRetry() {
  console.log('测试重试功能...');
  
  const queue = new TaskQueue({ 
    concurrency: 1,
    errorStrategy: 'retry',
    retryCount: 2
  });
  
  let attemptCount = 0;
  
  const result = await queue.add(async () => {
    attemptCount++;
    if (attemptCount < 3) {
      throw new Error(`尝试 ${attemptCount} 失败`);
    }
    return '重试成功';
  });
  
  if (attemptCount === 3 && result === '重试成功') {
    console.log('✅ 重试功能测试通过');
  } else {
    console.log('❌ 重试功能测试失败，尝试次数:', attemptCount);
  }
}

/**
 * 测试队列统计
 */
async function testStats() {
  console.log('测试队列统计...');
  
  const queue = new TaskQueue({ concurrency: 2 });
  
  // 初始统计
  let stats = queue.getStats();
  if (stats.pending === 0 && stats.running === 0 && stats.completed === 0) {
    console.log('✅ 初始统计测试通过');
  } else {
    console.log('❌ 初始统计测试失败:', stats);
  }
  
  // 添加任务并检查统计
  const promises = Array.from({ length: 4 }, () =>
    queue.add(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'done';
    })
  );
  
  // 等待一点时间让任务开始执行
  await new Promise(resolve => setTimeout(resolve, 10));
  stats = queue.getStats();
  
  if (stats.running === 2 && stats.pending === 2) {
    console.log('✅ 运行时统计测试通过');
  } else {
    console.log('❌ 运行时统计测试失败:', stats);
  }
  
  await Promise.all(promises);
  stats = queue.getStats();
  
  if (stats.completed === 4 && stats.running === 0 && stats.pending === 0) {
    console.log('✅ 完成统计测试通过');
  } else {
    console.log('❌ 完成统计测试失败:', stats);
  }
}

/**
 * 测试暂停和恢复
 */
async function testPauseResume() {
  console.log('测试暂停和恢复...');
  
  const queue = new TaskQueue({ concurrency: 1 });
  const results: string[] = [];
  
  // 添加任务
  const task1 = queue.add(async () => {
    results.push('task1');
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'result1';
  });
  
  // 暂停队列
  setTimeout(() => queue.pause(), 10);
  
  const task2 = queue.add(async () => {
    results.push('task2');
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'result2';
  });
  
  // 等待一段时间，task2不应该执行
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (results.length === 1 && results[0] === 'task1') {
    console.log('✅ 暂停功能测试通过');
  } else {
    console.log('❌ 暂停功能测试失败:', results);
  }
  
  // 恢复队列
  queue.resume();
  await task2;
  
  if (results.length === 2 && results[1] === 'task2') {
    console.log('✅ 恢复功能测试通过');
  } else {
    console.log('❌ 恢复功能测试失败:', results);
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('开始运行TaskQueue测试...\n');
  
  try {
    await testBasicFunctionality();
    await testConcurrency();
    await testPriority();
    await testErrorHandling();
    await testRetry();
    await testStats();
    await testPauseResume();
    
    console.log('\n所有测试完成！');
  } catch (error) {
    console.error('测试运行出错:', error);
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}