/**
 * Workspace 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../../core/dist/command.mjs';

export async function listWorkspaces() {
  const logger = new Logger();
  
  try {
    logger.info('📁 获取工作区列表...');
    
    // 获取所有工作区
    const workspaces = await Command.getWorkspaceList();
    const runningWorkspaces = await Command.getRunningWorkspaces();
    
    console.log('\n📋 工作区列表:');
    
    if (workspaces.length === 0) {
      console.log('  暂无工作区');
      return;
    }
    
    for (const workspace of workspaces) {
      const isRunning = runningWorkspaces.some((rw: any) => rw.path === workspace.path);
      const status = isRunning ? '🟢 运行中' : '⚪ 已停止';
      const type = (workspace as any).isGlobal ? '(全局)' : '';
      
      console.log(`  ${status} ${workspace.name} ${type}`);
      console.log(`      路径: ${workspace.path}`);
      if (workspace.description) {
        console.log(`      描述: ${workspace.description}`);
      }
    }
    
    console.log(`\n💡 总计: ${workspaces.length} 个工作区，${runningWorkspaces.length} 个运行中`);
    
  } catch (error) {
    logger.error('获取工作区列表失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function createWorkspace(path: string) {
  const logger = new Logger();
  
  try {
    logger.info(`📁 创建工作区: ${path}`);
    
    // 检查目录是否已经是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (isWorkspace) {
      logger.warn('该目录已经是一个工作区');
      return;
    }
    
    // 创建工作区
    const workspace = await Command.createWorkspace({
      workspacePath: path,
      name: require('path').basename(path)
    });
    
    logger.success(`✅ 工作区创建成功`);
    console.log(`名称: ${workspace.name}`);
    console.log(`路径: ${workspace.path}`);
    
  } catch (error) {
    logger.error('创建工作区失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function switchWorkspace(path: string) {
  const logger = new Logger();
  
  try {
    logger.info(`📁 切换到工作区: ${path}`);
    
    // 检查目录是否是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (!isWorkspace) {
      logger.error('该目录不是一个工作区');
      logger.info('使用 hyperchat workspace create <path> 先创建工作区');
      process.exit(1);
    }
    
    // 加载工作区
    const workspace = await Command.loadWorkspace({ workspacePath: path });
    if (!workspace) {
      logger.error('加载工作区失败');
      process.exit(1);
    }
    
    logger.success(`✅ 已切换到工作区: ${workspace!.name}`);
    console.log(`路径: ${workspace!.path}`);
    
    // 启动工作区的MCP客户端
    try {
      const mcpClients = await Command.startWorkspaceMcpClients({ workspacePath: path });
      logger.info(`🔧 启动了 ${mcpClients.length} 个MCP客户端`);
    } catch (mcpError) {
      logger.warn('启动MCP客户端时出现警告:', mcpError instanceof Error ? mcpError.message : String(mcpError));
    }
    
  } catch (error) {
    logger.error('切换工作区失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}