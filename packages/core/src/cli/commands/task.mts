/**
 * Task 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import type { CreateTaskRequest } from '@dadigua/hyperchat-shared';
import type { AgentConfig } from '@dadigua/hyperchat-shared/types';

/**
 * 获取当前工作区路径 - 查询模式
 */
async function getCurrentWorkspacePath(): Promise<string> {
  await workspaceManager.initialize(); // 只查询配置
  return workspaceManager.getCurrentWorkspacePath();
}

/**
 * 获取工作区路径并启动服务 - 仅用于任务触发
 */
async function initWorkspaceForExecution(): Promise<string> {
  await workspaceManager.initialize();
  await workspaceManager.start(); // 需要完整服务（调度器+AI）
  return workspaceManager.getCurrentWorkspacePath();
}

/**
 * 列出所有任务
 */
export async function listTasks() {
  const logger = new Logger();

  try {
    logger.info('📅 获取任务列表...');

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 使用工作区: ${workspacePath}`);

    // 获取任务列表
    const tasks = await Command.getAllTasks({ workspacePath });

    console.log('\n📅 任务列表:');

    if (tasks.length === 0) {
      console.log('  暂无任务');
      console.log('\n💡 使用 hyperchat task create <name> 创建新任务');
      return;
    }

    for (const task of tasks) {
      const statusIcon = task.disabled ? '⏸️' : '▶️';
      const statusText = task.disabled ? '已禁用' : '已启用';
      
      console.log(`  ${statusIcon} ${task.name}`);
      console.log(`      描述: ${task.description}`);
      console.log(`      代理: ${task.agentKey}`);
      console.log(`      调度: ${task.cron}`);
      console.log(`      状态: ${statusText}`);
      console.log('');
    }

    // 显示统计信息
    const enabledCount = tasks.filter(t => !t.disabled).length;
    const disabledCount = tasks.filter(t => t.disabled).length;
    console.log(`📊 统计: 总计 ${tasks.length} 个任务 (${enabledCount} 个已启用, ${disabledCount} 个已禁用)`);

  } catch (error) {
    logger.error('获取任务列表失败:', error);
    process.exit(1);
  }
}

/**
 * 创建任务
 */
export async function createTask(taskName: string, options: {
  description?: string;
  agent?: string;
  cron?: string;
  disabled?: boolean;
} = {}) {
  const logger = new Logger();

  try {
    logger.info(`📅 创建任务: ${taskName}`);

    // 获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 使用工作区: ${workspacePath}`);

    // 验证参数
    if (!options.description) {
      console.error('❌ 错误: 必须提供任务描述 (--description)');
      process.exit(1);
    }

    if (!options.agent) {
      console.error('❌ 错误: 必须指定代理 (--agent)');
      process.exit(1);
    }

    // 验证代理是否存在
    const agents = await Command.getWorkspaceAgentsSummary();
    const agentExists = agents.some(a => a.config.key === options.agent || a.config.name === options.agent);
    
    if (!agentExists) {
      console.error(`❌ 错误: 代理 '${options.agent}' 不存在`);
      console.log('\n可用代理:');
      for (const agentSummary of agents) {
        console.log(`  - ${agentSummary.config.name} (${agentSummary.config.key})`);
      }
      process.exit(1);
    }

    // 创建任务数据
    const taskData: CreateTaskRequest = {
      name: taskName,
      description: options.description,
      agentKey: options.agent,
      cron: options.cron || '0 0 * * *', // 默认每天午夜执行
      disabled: options.disabled || false,
    };

    // 创建任务只需要配置，不需要启动调度器
    const task = await Command.createTask({ workspacePath, taskData });

    console.log('✅ 任务创建成功!');
    console.log(`   名称: ${task.name}`);
    console.log(`   描述: ${task.description}`);
    console.log(`   代理: ${task.agentKey}`);
    console.log(`   调度: ${task.cron}`);
    console.log(`   状态: ${task.disabled ? '已禁用' : '已启用'}`);

  } catch (error) {
    logger.error('创建任务失败:', error);
    process.exit(1);
  }
}

/**
 * 显示任务详情
 */
export async function showTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 获取任务详情: ${taskName}`);

    // 获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.getTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ 错误: 任务 '${taskName}' 不存在`);
      process.exit(1);
    }

    console.log('\n📅 任务详情:');
    console.log(`   名称: ${task.name}`);
    console.log(`   描述: ${task.description}`);
    console.log(`   代理: ${task.agentKey}`);
    console.log(`   调度: ${task.cron}`);
    console.log(`   状态: ${task.disabled ? '已禁用' : '已启用'}`);

  } catch (error) {
    logger.error('获取任务详情失败:', error);
    process.exit(1);
  }
}

/**
 * 启用任务
 */
export async function enableTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 启用任务: ${taskName}`);

    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.enableTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ 错误: 任务 '${taskName}' 不存在`);
      process.exit(1);
    }

    console.log(`✅ 任务 '${taskName}' 已启用`);

  } catch (error) {
    logger.error('启用任务失败:', error);
    process.exit(1);
  }
}

/**
 * 禁用任务
 */
export async function disableTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 禁用任务: ${taskName}`);

    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.disableTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ 错误: 任务 '${taskName}' 不存在`);
      process.exit(1);
    }

    console.log(`✅ 任务 '${taskName}' 已禁用`);

  } catch (error) {
    logger.error('禁用任务失败:', error);
    process.exit(1);
  }
}

/**
 * 删除任务
 */
export async function deleteTask(taskName: string, options: { force?: boolean } = {}) {
  const logger = new Logger();

  try {
    logger.info(`📅 删除任务: ${taskName}`);

    const workspacePath = await getCurrentWorkspacePath();
    
    // 检查任务是否存在
    const task = await Command.getTask({ workspacePath, taskName });
    if (!task) {
      console.error(`❌ 错误: 任务 '${taskName}' 不存在`);
      process.exit(1);
    }

    // 确认删除（除非使用 --force）
    if (!options.force) {
      console.log(`⚠️  即将删除任务: ${task.name}`);
      console.log(`   描述: ${task.description}`);
      console.log('   此操作不可撤销!');
      console.log('\n   使用 --force 参数跳过确认');
      process.exit(1);
    }

    const success = await Command.deleteTask({ workspacePath, taskName });

    if (success) {
      console.log(`✅ 任务 '${taskName}' 已删除`);
    } else {
      console.error(`❌ 删除任务 '${taskName}' 失败`);
      process.exit(1);
    }

  } catch (error) {
    logger.error('删除任务失败:', error);
    process.exit(1);
  }
}

/**
 * 编辑任务
 */
export async function editTask(taskName: string, options: {
  description?: string;
  agent?: string;
  cron?: string;
  enable?: boolean;
  disable?: boolean;
} = {}) {
  const logger = new Logger();

  try {
    logger.info(`📅 编辑任务: ${taskName}`);

    const workspacePath = await getCurrentWorkspacePath();
    
    // 检查任务是否存在
    const existingTask = await Command.getTask({ workspacePath, taskName });
    if (!existingTask) {
      console.error(`❌ 错误: 任务 '${taskName}' 不存在`);
      process.exit(1);
    }

    // 构建更新数据
    const updates: any = {};
    
    if (options.description !== undefined) {
      updates.description = options.description;
    }
    
    if (options.agent !== undefined) {
      // 验证代理是否存在
      const agents = await Command.getWorkspaceAgentsSummary();
      const agentExists = agents.some(a => a.config.key === options.agent || a.config.name === options.agent);
      
      if (!agentExists) {
        console.error(`❌ 错误: 代理 '${options.agent}' 不存在`);
        process.exit(1);
      }
      
      updates.agentKey = options.agent;
    }
    
    if (options.cron !== undefined) {
      updates.cron = options.cron;
    }
    
    if (options.enable) {
      updates.disabled = false;
    } else if (options.disable) {
      updates.disabled = true;
    }

    // 检查是否有更新
    if (Object.keys(updates).length === 0) {
      console.log('❌ 错误: 没有提供要更新的字段');
      process.exit(1);
    }

    // 更新任务
    const updatedTask = await Command.updateTask({ workspacePath, taskName, updates });

    if (!updatedTask) {
      console.error('❌ 更新任务失败');
      process.exit(1);
    }

    console.log('✅ 任务更新成功!');
    console.log(`   名称: ${updatedTask.name}`);
    console.log(`   描述: ${updatedTask.description}`);
    console.log(`   代理: ${updatedTask.agentKey}`);
    console.log(`   调度: ${updatedTask.cron}`);
    console.log(`   状态: ${updatedTask.disabled ? '已禁用' : '已启用'}`);

  } catch (error) {
    logger.error('编辑任务失败:', error);
    process.exit(1);
  }
}


/**
 * 获取任务统计信息
 */
export async function taskStats() {
  const logger = new Logger();

  try {
    logger.info('📅 获取任务统计...');

    const workspacePath = await getCurrentWorkspacePath();
    const stats = await Command.getTaskStats({ workspacePath });

    console.log('\n📊 任务统计:');
    console.log(`   总任务数: ${stats.total}`);
    console.log(`   已启用: ${stats.enabled}`);
    console.log(`   已禁用: ${stats.disabled}`);
    
    if (Object.keys(stats.agentCounts).length > 0) {
      console.log('\n🤖 按代理分组:');
      for (const [agentKey, count] of Object.entries(stats.agentCounts)) {
        console.log(`   ${agentKey}: ${count} 个任务`);
      }
    }

    // 显示调度状态只需要配置
    const scheduledTasks = await Command.getScheduledTasks({ workspacePath });
    console.log(`\n⏰ 调度状态: ${scheduledTasks.length} 个任务正在调度中`);
    if (scheduledTasks.length > 0) {
      for (const taskName of scheduledTasks) {
        console.log(`   🔄 ${taskName}`);
      }
    }

  } catch (error) {
    logger.error('获取任务统计失败:', error);
    process.exit(1);
  }
}

/**
 * 手动触发任务执行
 */
export async function triggerTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`⚡ 手动触发任务: ${taskName}`);

    // 触发任务需要完整服务（调度器+AI）
    const workspacePath = await initWorkspaceForExecution();
    await Command.triggerTask({ workspacePath, taskName });

    console.log(`✅ 任务 '${taskName}' 已触发执行`);

  } catch (error) {
    logger.error('触发任务失败:', error);
    process.exit(1);
  }
}

/**
 * 显示调度状态
 */
export async function showScheduler() {
  const logger = new Logger();

  try {
    logger.info('📅 获取调度状态...');

    const workspacePath = await getCurrentWorkspacePath();
    const scheduledTasks = await Command.getScheduledTasks({ workspacePath });

    console.log('\n⏰ 任务调度器状态:');
    console.log(`   调度中的任务: ${scheduledTasks.length} 个`);
    
    if (scheduledTasks.length > 0) {
      console.log('\n🔄 正在调度的任务:');
      for (const taskName of scheduledTasks) {
        const task = await Command.getTask({ workspacePath, taskName });
        if (task) {
          console.log(`   📋 ${task.name}`);
          console.log(`      代理: ${task.agentKey}`);
          console.log(`      调度: ${task.cron}`);
          console.log(`      描述: ${task.description}`);
          console.log('');
        }
      }
    } else {
      console.log('   暂无任务在调度中');
    }

  } catch (error) {
    logger.error('获取调度状态失败:', error);
    process.exit(1);
  }
}