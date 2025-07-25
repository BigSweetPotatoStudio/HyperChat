#!/usr/bin/env node

/**
 * 测试WebAgentManager的Agent发现功能
 */

import { WebAgentManager } from './packages/core/dist/cli/webAgentManager.mjs';

console.log('🧪 测试 WebAgentManager Agent发现功能...\n');

async function testAgentDiscovery() {
  const webManager = new WebAgentManager();

  try {
    console.log('🔍 测试1: 发现当前目录下的Agent');
    const currentDirAgents = await webManager.discoverAgents();
    console.log(`发现结果: ${currentDirAgents.length}个Agent\n`);

    console.log('🔍 测试2: 发现当前目录下的Agent（不包含全局）');
    const localOnlyAgents = await webManager.discoverAgents(undefined, {
      includeGlobal: false
    });
    console.log(`本地发现结果: ${localOnlyAgents.length}个Agent\n`);

    console.log('🔍 测试3: 发现指定路径下的Agent');
    const testPath = './packages'; // 测试目录
    const pathAgents = await webManager.discoverAgents(testPath);
    console.log(`指定路径发现结果: ${pathAgents.length}个Agent\n`);

    // 如果发现了Agent，测试批量启动
    if (currentDirAgents.length > 0) {
      console.log('🚀 测试4: 批量启动发现的Agent（禁用MCP和任务调度器）');
      try {
        const startedAgents = await webManager.discoverAndStartAgents(undefined, {
          includeGlobal: false,  // 只启动本地Agent
          enableMCP: false,      // 禁用MCP避免复杂初始化
          enableTaskScheduler: false, // 禁用任务调度器
          maxAgents: 3,          // 最多启动3个Agent
        });
        
        console.log(`✅ 成功启动${startedAgents.length}个Agent`);
        
        // 显示启动的Agent信息
        console.log('\n📋 已启动的Agent列表:');
        const summaries = await webManager.getAgentSummaries();
        summaries.forEach((summary, index) => {
          console.log(`  ${index + 1}. ${summary.config.name} (${summary.path})`);
          console.log(`     聊天记录: ${summary.chatLogsCount}, MCP配置: ${summary.hasMCPConfig}, 任务: ${summary.tasksCount}`);
        });
        
      } catch (error) {
        console.log(`❌ 批量启动失败: ${error.message}`);
      }
    } else {
      console.log('⚠️  没有发现可用的Agent，跳过批量启动测试');
    }

    console.log('\n✅ Agent发现功能测试完成!');

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
}

// 运行测试
testAgentDiscovery().catch(console.error);