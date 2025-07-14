/**
 * Task 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import { t } from '../../i18n.mjs';
import type { CreateTaskRequest } from '@dadigua/hyperchat-shared';
import type { AgentConfig } from '@dadigua/hyperchat-shared';

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
    logger.info(`📅 ${t`Getting task list...`}`);

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 ${t`Using workspace: ${workspacePath}`}`);

    // 获取任务列表
    const tasks = await Command.getAllTasks({ workspacePath });

    console.log(`\n📅 ${t`Task list:`}`);

    if (tasks.length === 0) {
      console.log(`  ${t`No tasks found`}`);
      console.log(`\n💡 ${t`Use hyperchat task create <name> to create a new task`}`);
      return;
    }

    for (const task of tasks) {
      const statusIcon = task.disabled ? '⏸️' : '▶️';
      const statusText = task.disabled ? t`Disabled` : t`Enabled`;
      
      console.log(`  ${statusIcon} ${task.name}`);
      console.log(`      ${t`Description`}: ${task.description}`);
      console.log(`      ${t`Agent`}: ${task.agentName}`);
      console.log(`      ${t`Schedule`}: ${task.cron}`);
      console.log(`      ${t`Status`}: ${statusText}`);
      console.log('');
    }

    // 显示统计信息
    const enabledCount = tasks.filter(t => !t.disabled).length;
    const disabledCount = tasks.filter(t => t.disabled).length;
    console.log(`📊 ${t`Statistics: Total ${tasks.length} tasks (${enabledCount} enabled, ${disabledCount} disabled)`}`);

  } catch (error) {
    logger.error(t`Failed to get task list: ${error}`);
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
    logger.info(`📅 ${t`Creating task: ${taskName}`}`);

    // 获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 ${t`Using workspace: ${workspacePath}`}`);

    // 验证参数
    if (!options.description) {
      console.error(`❌ ${t`Error: Task description is required (--description)`}`);
      process.exit(1);
    }

    if (!options.agent) {
      console.error(`❌ ${t`Error: Agent must be specified (--agent)`}`);
      process.exit(1);
    }

    // 验证代理是否存在
    const agents = await Command.getWorkspaceAgentsSummary();
    const agentExists = agents.some(a => a.config.name === options.agent);
    
    if (!agentExists) {
      console.error(`❌ ${t`Error: Agent '${options.agent}' does not exist`}`);
      console.log(`\n${t`Available agents:`}`);
      for (const agentSummary of agents) {
        console.log(`  - ${agentSummary.config.name} `);
      }
      process.exit(1);
    }

    // 创建任务数据
    const taskData: CreateTaskRequest = {
      name: taskName,
      description: options.description,
      agentName: options.agent,
      cron: options.cron || '0 0 * * *', // 默认每天午夜执行
      disabled: options.disabled || false,
    };

    // 创建任务只需要配置，不需要启动调度器
    const task = await Command.createTask({ workspacePath, taskData });

    console.log(`✅ ${t`Task created successfully!`}`);
    console.log(`   ${t`Name: ${task.name}`}`);
    console.log(`   ${t`Description: ${task.description}`}`);
    console.log(`   ${t`Agent: ${task.agentName}`}`);
    console.log(`   ${t`Schedule: ${task.cron}`}`);
    console.log(`   ${t`Status: ${task.disabled ? t`Disabled` : t`Enabled`}`}`);

  } catch (error) {
    logger.error(t`Failed to create task: ${error}`);
    process.exit(1);
  }
}

/**
 * 显示任务详情
 */
export async function showTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Getting task details: ${taskName}`}`);

    // 获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.getTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ ${t`Error: Task '${taskName}' does not exist`}`);
      process.exit(1);
    }

    console.log(`\n📅 ${t`Task details:`}`);
    console.log(`   ${t`Name: ${task.name}`}`);
    console.log(`   ${t`Description: ${task.description}`}`);
    console.log(`   ${t`Agent: ${task.agentName}`}`);
    console.log(`   ${t`Schedule: ${task.cron}`}`);
    console.log(`   ${t`Status: ${task.disabled ? t`Disabled` : t`Enabled`}`}`);

  } catch (error) {
    logger.error(t`Failed to get task details: ${error}`);
    process.exit(1);
  }
}

/**
 * 启用任务
 */
export async function enableTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Enabling task: ${taskName}`}`);

    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.enableTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ ${t`Error: Task '${taskName}' does not exist`}`);
      process.exit(1);
    }

    console.log(`✅ ${t`Task '${taskName}' enabled`}`);

  } catch (error) {
    logger.error(t`Failed to enable task: ${error}`);
    process.exit(1);
  }
}

/**
 * 禁用任务
 */
export async function disableTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Disabling task: ${taskName}`}`);

    const workspacePath = await getCurrentWorkspacePath();
    const task = await Command.disableTask({ workspacePath, taskName });

    if (!task) {
      console.error(`❌ ${t`Error: Task '${taskName}' does not exist`}`);
      process.exit(1);
    }

    console.log(`✅ ${t`Task '${taskName}' disabled`}`);

  } catch (error) {
    logger.error(t`Failed to disable task: ${error}`);
    process.exit(1);
  }
}

/**
 * 删除任务
 */
export async function deleteTask(taskName: string, options: { force?: boolean } = {}) {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Deleting task: ${taskName}`}`);

    const workspacePath = await getCurrentWorkspacePath();
    
    // 检查任务是否存在
    const task = await Command.getTask({ workspacePath, taskName });
    if (!task) {
      console.error(`❌ ${t`Error: Task '${taskName}' does not exist`}`);
      process.exit(1);
    }

    // 确认删除（除非使用 --force）
    if (!options.force) {
      console.log(`⚠️  ${t`About to delete task: ${task.name}`}`);
      console.log(`   ${t`Description: ${task.description}`}`);
      console.log(`   ${t`This operation cannot be undone!`}`);
      console.log(`\n   ${t`Use --force parameter to skip confirmation`}`);
      process.exit(1);
    }

    const success = await Command.deleteTask({ workspacePath, taskName });

    if (success) {
      console.log(`✅ ${t`Task '${taskName}' deleted`}`);
    } else {
      console.error(`❌ ${t`Failed to delete task '${taskName}'`}`);
      process.exit(1);
    }

  } catch (error) {
    logger.error(t`Failed to delete task: ${error}`);
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
    logger.info(`📅 ${t`Editing task: ${taskName}`}`);

    const workspacePath = await getCurrentWorkspacePath();
    
    // 检查任务是否存在
    const existingTask = await Command.getTask({ workspacePath, taskName });
    if (!existingTask) {
      console.error(`❌ ${t`Error: Task '${taskName}' does not exist`}`);
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
      const agentExists = agents.some(a => a.config.name === options.agent);
      
      if (!agentExists) {
        console.error(`❌ ${t`Error: Agent '${options.agent}' does not exist`}`);
        process.exit(1);
      }
      
      updates.agentName = options.agent;
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
      console.log(`❌ ${t`Error: No fields provided for update`}`);
      process.exit(1);
    }

    // 更新任务
    const updatedTask = await Command.updateTask({ workspacePath, taskName, updates });

    if (!updatedTask) {
      console.error(`❌ ${t`Failed to update task`}`);
      process.exit(1);
    }

    console.log(`✅ ${t`Task updated successfully!`}`);
    console.log(`   ${t`Name: ${updatedTask.name}`}`);
    console.log(`   ${t`Description: ${updatedTask.description}`}`);
    console.log(`   ${t`Agent: ${updatedTask.agentName}`}`);
    console.log(`   ${t`Schedule: ${updatedTask.cron}`}`);
    console.log(`   ${t`Status: ${updatedTask.disabled ? t`Disabled` : t`Enabled`}`}`);

  } catch (error) {
    logger.error(t`Failed to edit task: ${error}`);
    process.exit(1);
  }
}


/**
 * 获取任务统计信息
 */
export async function taskStats() {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Getting task statistics...`}`);

    const workspacePath = await getCurrentWorkspacePath();
    const stats = await Command.getTaskStats({ workspacePath });

    console.log(`\n📊 ${t`Task statistics:`}`);
    console.log(`   ${t`Total tasks: ${stats.total}`}`);
    console.log(`   ${t`Enabled: ${stats.enabled}`}`);
    console.log(`   ${t`Disabled: ${stats.disabled}`}`);
    
    if (Object.keys(stats.agentCounts).length > 0) {
      console.log(`\n🤖 ${t`Grouped by agent:`}`);
      for (const [agentName, count] of Object.entries(stats.agentCounts)) {
        console.log(`   ${agentName}: ${count} ${t`tasks`}`);
      }
    }

    // 显示调度状态只需要配置
    const scheduledTasks = await Command.getScheduledTasks({ workspacePath });
    console.log(`\n⏰ ${t`Scheduler status: ${scheduledTasks.length} tasks in scheduling`}`);
    if (scheduledTasks.length > 0) {
      for (const taskName of scheduledTasks) {
        console.log(`   🔄 ${taskName}`);
      }
    }

  } catch (error) {
    logger.error(t`Failed to get task statistics: ${error}`);
    process.exit(1);
  }
}

/**
 * 手动触发任务执行
 */
export async function triggerTask(taskName: string) {
  const logger = new Logger();

  try {
    logger.info(`⚡ ${t`Manually triggering task: ${taskName}`}`);

    // 触发任务需要完整服务（调度器+AI）
    const workspacePath = await initWorkspaceForExecution();
    await Command.triggerTask({ workspacePath, taskName });

    console.log(`✅ ${t`Task '${taskName}' triggered for execution`}`);

  } catch (error) {
    logger.error(t`Failed to trigger task: ${error}`);
    process.exit(1);
  }
}

/**
 * 显示调度状态
 */
export async function showScheduler() {
  const logger = new Logger();

  try {
    logger.info(`📅 ${t`Getting scheduler status...`}`);

    const workspacePath = await getCurrentWorkspacePath();
    const scheduledTasks = await Command.getScheduledTasks({ workspacePath });

    console.log(`\n⏰ ${t`Task scheduler status:`}`);
    console.log(`   ${t`Tasks in scheduling: ${scheduledTasks.length} items`}`);
    
    if (scheduledTasks.length > 0) {
      console.log(`\n🔄 ${t`Tasks being scheduled:`}`);
      for (const taskName of scheduledTasks) {
        const task = await Command.getTask({ workspacePath, taskName });
        if (task) {
          console.log(`   📋 ${task.name}`);
          console.log(`      ${t`Agent: ${task.agentName}`}`);
          console.log(`      ${t`Schedule: ${task.cron}`}`);
          console.log(`      ${t`Description: ${task.description}`}`);
          console.log('');
        }
      }
    } else {
      console.log(`   ${t`No tasks in scheduling`}`);
    }

  } catch (error) {
    logger.error(t`Failed to get scheduler status: ${error}`);
    process.exit(1);
  }
}