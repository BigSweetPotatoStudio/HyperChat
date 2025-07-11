/**
 * Workspace 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from "../../../core/src/command.mjs";

/**
 * 获取当前工作区路径（使用新的会话管理器，只读模式）
 */
async function getCurrentWorkspacePath(): Promise<string> {
  const { getCurrentWorkspacePathReadOnly } = await import('../session/cli-session-manager.mjs');
  const workspaceInfo = await getCurrentWorkspacePathReadOnly();
  return workspaceInfo.workspacePath;
}

export async function listWorkspaces() {
  const logger = new Logger();
  
  try {
    logger.info('📁 获取工作区列表...');
    
    // 获取当前工作区
    const currentWorkspacePath = await getCurrentWorkspacePath();
    
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
      const isCurrent = workspace.path === currentWorkspacePath ? '👉 当前' : '';
      
      console.log(`  ${status} ${workspace.name} ${type} ${isCurrent}`);
      console.log(`      路径: ${workspace.path}`);
      if (workspace.description) {
        console.log(`      描述: ${workspace.description}`);
      }
    }
    
    console.log(`\n💡 总计: ${workspaces.length} 个工作区，${runningWorkspaces.length} 个运行中`);
    console.log(`🎯 当前工作区: ${currentWorkspacePath}`);
    
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

export async function showWorkspaceInfo(path: string) {
  const logger = new Logger();
  
  try {
    logger.info(`📁 查看工作区信息: ${path}`);
    
    // 检查目录是否是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (!isWorkspace) {
      logger.error('该目录不是一个工作区');
      return;
    }
    
    // 获取工作区信息
    const workspaceConfig = await Command.loadWorkspace({ workspacePath: path });
    if (!workspaceConfig) {
      logger.error('无法加载工作区配置');
      return;
    }
    
    console.log('\n📋 工作区信息:');
    console.log(`  名称: ${workspaceConfig.name}`);
    console.log(`  路径: ${path}`);
    console.log(`  描述: ${workspaceConfig.description || '无描述'}`);
    console.log(`  创建时间: ${new Date(workspaceConfig.createdAt).toLocaleString()}`);
    console.log(`  最后访问: ${new Date(workspaceConfig.lastAccessed).toLocaleString()}`);
    
    // 获取MCP客户端信息
    try {
      const mcpClients = await Command.getWorkspaceMcpClients({ workspacePath: path });
      console.log(`  MCP客户端: ${mcpClients.length} 个`);
      if (mcpClients.length > 0) {
        mcpClients.forEach(client => {
          console.log(`    - ${client.serverName} (${client.status})`);
        });
      }
    } catch (error) {
      console.log(`  MCP客户端: 获取失败`);
    }
    
  } catch (error) {
    logger.error('获取工作区信息失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}