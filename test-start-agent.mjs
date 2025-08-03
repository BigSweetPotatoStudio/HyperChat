#!/usr/bin/env node

/**
 * 测试新的 startAgent 方法
 */

import { WebAgentManager } from './packages/core/dist/cli/webAgentManager.mjs';

console.log('🧪 测试 WebAgentManager.startAgent 方法...\n');

const webManager = new WebAgentManager();

try {
  // 模拟一个Agent路径
  const testAgentPath1 = '/tmp/test-agent-1';
  const testAgentPath2 = '/tmp/test-agent-2';

  console.log('📊 初始状态:');
  console.log(`Agent数量: ${webManager.size()}`);
  console.log(`Agent路径: ${JSON.stringify(webManager.getAgentPaths())}\n`);

  console.log('🚀 测试启动Agent (禁用MCP和任务调度器)...');
  
  // 测试启动第一个Agent
  try {
    const agent1 = await webManager.startAgent(testAgentPath1, {
      enableMCP: false,
      enableTaskScheduler: false,
    });
    console.log(`✅ Agent1启动成功: ${agent1.getConfig().name}`);
  } catch (error) {
    console.log(`❌ Agent1启动失败: ${error.message}`);
  }

  // 测试启动第二个Agent
  try {
    const agent2 = await webManager.startAgent(testAgentPath2, {
      enableMCP: false,
      enableTaskScheduler: false,
    });
    console.log(`✅ Agent2启动成功: ${agent2.getConfig().name}`);
  } catch (error) {
    console.log(`❌ Agent2启动失败: ${error.message}`);
  }

  console.log(`\n📊 启动后状态:`);
  console.log(`Agent数量: ${webManager.size()}`);
  console.log(`Agent路径: ${JSON.stringify(webManager.getAgentPaths())}`);

  // 测试重复启动相同路径的Agent
  console.log(`\n🔄 测试重复启动Agent1...`);
  try {
    const agent1Again = await webManager.startAgent(testAgentPath1);
    console.log(`✅ 重复启动Agent1成功（应该复用实例）`);
    console.log(`Agent数量保持不变: ${webManager.size()}`);
  } catch (error) {
    console.log(`❌ 重复启动Agent1失败: ${error.message}`);
  }

  // 获取Agent摘要
  console.log(`\n📋 获取Agent摘要...`);
  try {
    const summaries = await webManager.getAgentSummaries();
    console.log(`摘要数量: ${summaries.length}`);
    summaries.forEach((summary, index) => {
      console.log(`  Agent${index + 1}: ${summary.config.name} (${summary.path})`);
    });
  } catch (error) {
    console.log(`❌ 获取摘要失败: ${error.message}`);
  }

  console.log('\n✅ startAgent 方法测试完成!');

} catch (error) {
  console.error('❌ 测试过程中发生错误:', error);
} finally {
  // 清理资源
  try {
    await webManager.destroy();
    console.log('🧹 资源清理完成');
  } catch (error) {
    console.error('清理资源时出错:', error);
  }
}