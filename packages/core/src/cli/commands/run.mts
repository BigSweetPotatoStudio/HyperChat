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
    logger.info('🚀 启动 HyperChat 核心服务...');
    
    // 确定工作区路径
    const workspacePath = options.workspace || process.cwd();
    logger.info(`🎯 使用工作区: ${workspacePath}`);
    
    // 初始化工作区管理器
    logger.info('⏳ 初始化工作区...');
    await getWorkspaceManager().initialize(workspacePath);
    
    const workspace = getWorkspaceManager().getCurrentWorkspace();
    if (!workspace) {
      throw new Error('无法获取当前工作区');
    }
    
    // 获取工作区摘要信息
    const summary = await workspace.getSummary();
    
    logger.info('✅ 核心服务启动成功');
    logger.info(`📊 工作区状态:`);
    logger.info(`   - Agents: ${summary.agentsCount} 个`);
    logger.info(`   - MCP 服务: ${summary.mcpServersCount} 个`);
    logger.info(`   - 任务: ${summary.tasksCount} 个`);
    
    // 显示正在调度的任务
    const scheduledTasks = workspace.getScheduledTasks();
    if (scheduledTasks.length > 0) {
      logger.info(`⏰ 调度中的任务: ${scheduledTasks.length} 个`);
      for (const taskName of scheduledTasks) {
        logger.info(`   🔄 ${taskName}`);
      }
    } else {
      logger.info('⏰ 暂无调度中的任务');
    }
    
    logger.info('🔄 服务已启动，按 Ctrl+C 停止...');
    
    // 保持进程运行
    await keepAlive();
    
  } catch (error) {
    logger.error('启动失败:', error instanceof Error ? error.message : String(error));
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
    logger.info(`\n📥 收到退出信号 ${signal}，正在关闭服务...`);
    
    try {
      // 清理工作区资源
      const workspaceManager = getWorkspaceManager();
      await workspaceManager.uninitialize();
      
      logger.info('✅ 服务已安全关闭');
      process.exit(0);
    } catch (error) {
      logger.error('关闭服务时出错:', error);
      process.exit(1);
    }
  };
  
  // 监听退出信号
  process.on('SIGINT', () => gracefulExit('SIGINT'));   // Ctrl+C
  process.on('SIGTERM', () => gracefulExit('SIGTERM')); // 终止信号
  process.on('SIGQUIT', () => gracefulExit('SIGQUIT')); // 退出信号
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    gracefulExit('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的 Promise 拒绝:', reason);
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
    logger.info('📊 HyperChat 运行状态:');
    
    const workspaceManager = getWorkspaceManager();
    
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        logger.info('❌ 无可用工作区');
        return;
      }
      
      const summary = await workspace.getSummary();
      const scheduledTasks = workspace.getScheduledTasks();
      
      logger.info('✅ 服务正在运行');
      logger.info(`🎯 工作区: ${workspace.workspacePath}`);
      logger.info(`📊 状态:`);
      logger.info(`   - Agents: ${summary.agentsCount} 个`);
      logger.info(`   - MCP 服务: ${summary.mcpServersCount} 个`);
      logger.info(`   - 任务: ${summary.tasksCount} 个`);
      logger.info(`   - 调度中: ${scheduledTasks.length} 个任务`);
      
      if (scheduledTasks.length > 0) {
        logger.info('⏰ 调度中的任务:');
        for (const taskName of scheduledTasks) {
          logger.info(`   🔄 ${taskName}`);
        }
      }
    } catch (initError) {
      logger.info('❌ 服务未运行或未初始化');
      return;
    }
    
  } catch (error) {
    logger.error('获取状态失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}