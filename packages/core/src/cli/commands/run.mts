/**
 * Run 命令实现
 * 
 * 启动 HyperChat 核心服务但不启动 HTTP 服务器
 * 适用于后台运行、定时任务执行等场景
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import "../../first.mjs";
import { getWorkspaceManager } from "../../workspace/index.mjs";
import { t } from '../../i18n.mjs';

export interface RunOptions {
  verbose?: boolean;
  quiet?: boolean;
  workspace?: string;
}

/**
 * 启动核心服务（不包含 HTTP 服务器）
 */
export async function startRun(options: RunOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);
  
  try {
    logger.info(`🚀 ${t`Starting core service...`}`);
    
    // 确定工作区路径
    const workspacePath = options.workspace || process.cwd();
    logger.info(`🎯 ${t`Using workspace:`} ${workspacePath}`);
    
    // 第一阶段：快速初始化工作区配置
    logger.info(`⏳ ${t`Phase 1: Quickly loading workspace configuration...`}`);
    const currentWorkingDirectory = workspacePath || process.cwd();
    await getWorkspaceManager().initialize(currentWorkingDirectory);
    
    const workspace = getWorkspaceManager().getCurrentWorkspace();
    if (!workspace) {
      throw new Error(t`Cannot get current workspace`);
    }
    
    // 显示基本信息（此时服务还未启动）
    logger.info(`✅ ${t`Workspace configuration loaded`}`);
    logger.info(`🎯 ${t`Workspace path:`} ${workspace.workspacePath}`);
    logger.info(`📁 ${t`Status:`} ${workspace.getState()}`);
    
    // 第二阶段：启动所有服务
    logger.info(`⏳ ${t`Phase 2: Starting workspace services...`}`);
    await getWorkspaceManager().start();
    
    // 获取完整的工作区摘要信息
    const summary = await workspace.getSummary();
    
    logger.info(`✅ ${t`Core service is running`}`);
    logger.info(`📊 ${t`Workspace status:`}`);
    logger.info(`   - ${t`Status:`} ${workspace.getState()}`);
    logger.info(`   - ${t`Agents:`} ${summary.agentsCount}`);
    logger.info(`   - ${t`MCP services:`} ${summary.mcpServersCount}`);
    logger.info(`   - ${t`Tasks:`} ${summary.tasksCount}`);
    
    // 显示正在调度的任务
    const scheduledTasks = workspace.getScheduledTasks();
    if (scheduledTasks.length > 0) {
      logger.info(`⏰ ${t`Tasks in scheduling:`} ${scheduledTasks.length} ${t`items`}`);
      for (const taskName of scheduledTasks) {
        logger.info(`   🔄 ${taskName}`);
      }
    } else {
      logger.info(`⏰ ${t`No tasks in scheduling`}`);
    }
    
    logger.info(`🔄 ${t`Service started, press Ctrl+C to stop...`}`);
    
    // 保持进程运行
    await keepAlive();
    
  } catch (error) {
    logger.error(`${t`Startup failed:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 保持进程运行，监听退出信号
 */
async function keepAlive(): Promise<void> {
  const logger = new Logger();
  
  // 优雅退出处理
  const gracefulExit = async (signal: string) => {
    logger.info(`\n📥 ${t`Received exit signal`} ${signal}, ${t`shutting down service...`}`);
    
    try {
      // 清理工作区资源
      const workspaceManager = getWorkspaceManager();
      await workspaceManager.uninitialize();
      
      logger.info(t`✅ Service shut down safely`);
      process.exit(0);
    } catch (error) {
      logger.error(`${t`Error shutting down service:`} ${error}`);
      process.exit(1);
    }
  };
  
  // 监听退出信号
  process.on('SIGINT', () => gracefulExit('SIGINT'));   // Ctrl+C
  process.on('SIGTERM', () => gracefulExit('SIGTERM')); // 终止信号
  process.on('SIGQUIT', () => gracefulExit('SIGQUIT')); // 退出信号
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error(`${t`Uncaught exception:`} ${error}`);
    gracefulExit('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`${t`Unhandled Promise rejection:`} ${reason}`);
    gracefulExit('UNHANDLED_REJECTION');
  });
  
  // 保持事件循环运行
  return new Promise(() => {
    // 这个 Promise 永远不会 resolve，保持进程运行
    // 直到收到退出信号
  });
}

/**
 * 显示运行状态信息
 */
export async function showRunStatus() {
  const logger = new Logger();
  
  try {
    logger.info(`📊 ${t`HyperChat runtime status:`}`);
    
    const workspaceManager = getWorkspaceManager();
    
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        logger.info(`❌ ${t`No available workspace`}`);
        return;
      }
      
      const summary = await workspace.getSummary();
      const scheduledTasks = workspace.getScheduledTasks();
      
      logger.info(`✅ ${t`Service is running`}`);
      logger.info(`🎯 ${t`Workspace:`} ${workspace.workspacePath}`);
      logger.info(`📊 ${t`Status:`}`);
      logger.info(`   - ${t`Agents:`} ${summary.agentsCount} ${t`items`}`);
      logger.info(`   - ${t`MCP services:`} ${summary.mcpServersCount} ${t`items`}`);
      logger.info(`   - ${t`Tasks:`} ${summary.tasksCount} ${t`items`}`);
      logger.info(`   - ${t`In scheduling:`} ${scheduledTasks.length} ${t`tasks`}`);
      
      if (scheduledTasks.length > 0) {
        logger.info(`⏰ ${t`Tasks in scheduling:`}`);
        for (const taskName of scheduledTasks) {
          logger.info(`   🔄 ${taskName}`);
        }
      }
    } catch (initError) {
      logger.info(`❌ ${t`Service not running or not initialized`}`);
      return;
    }
    
  } catch (error) {
    logger.error(`${t`Failed to get status:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}