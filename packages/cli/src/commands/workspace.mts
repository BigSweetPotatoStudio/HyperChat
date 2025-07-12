/**
 * Workspace 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from "../../../core/src/command.mjs";
import { getWorkspaceManager } from '../../../core/src/workspace/index.mjs';
/**
 * 获取当前工作区路径（新架构）
 */
async function getCurrentWorkspacePath(): Promise<string> {

  const workspaceManager = getWorkspaceManager();
  await workspaceManager.initialize(process.cwd());
  return workspaceManager.getCurrentWorkspacePath();
}

export async function listWorkspaces() {
  const logger = new Logger();
  
  try {
    logger.info('📁 获取工作区列表...');
    
    // 获取当前工作区
    const currentWorkspacePath = await getCurrentWorkspacePath();
    
    // 新架构：只显示当前工作区
    const currentWorkspace = await Command.getCurrentWorkspace();
    
    console.log('\n📋 当前工作区:');
    
    if (!currentWorkspace) {
      console.log('  未找到工作区');
      return;
    }
    
    const type = currentWorkspace.isGlobal ? '(全局)' : '';
    console.log(`  🟢 ${currentWorkspace.name} ${type} 👉 当前`);
    console.log(`      路径: ${currentWorkspace.path}`);
    if (currentWorkspace.description) {
      console.log(`      描述: ${currentWorkspace.description}`);
    }
    console.log(`      Agents: ${currentWorkspace.agentsCount}`);
    console.log(`      MCP 服务: ${currentWorkspace.mcpServersCount}`);
    
    console.log(`\n🎯 当前工作区: ${currentWorkspacePath}`);
    
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
    // loadWorkspace 已删除，直接使用 openWorkspace\n    const workspaceConfig = await Command.openWorkspace({ workspacePath: path });
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