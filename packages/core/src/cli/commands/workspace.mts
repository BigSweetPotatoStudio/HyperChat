/**
 * Workspace 命令实现
 */

import process from 'process';
import { basename } from 'path';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import { t } from '../../i18n.mjs';
/**
 * 获取当前工作区路径（新架构）
 */
async function getCurrentWorkspacePath(): Promise<string> {

  // workspaceManager is already imported
  await workspaceManager.initialize();
  return workspaceManager.getCurrentWorkspacePath();
}

export async function listWorkspaces() {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Getting workspace list...`}`);

    // 获取当前工作区
    const currentWorkspacePath = await getCurrentWorkspacePath();

    // 新架构：只显示当前工作区
    const currentWorkspace = await Command.getCurrentWorkspace();

    console.log(`\n📋 ${t`Current workspace:`}`);

    if (!currentWorkspace) {
      console.log(`  ${t`No workspace found`}`);
      return;
    }

    const type = currentWorkspace.isGlobal ? t`(Global)` : '';
    console.log(`  🟢 ${currentWorkspace.name} ${type} 👉 ${t`Current`}`);
    console.log(`      ${t`Path: ${currentWorkspace.path}`}`);
    if (currentWorkspace.description) {
      console.log(`      ${t`Description: ${currentWorkspace.description}`}`);
    }
    console.log(`      ${t`Agents: ${currentWorkspace.agentsCount}`}`);
    console.log(`      ${t`MCP services: ${currentWorkspace.mcpServersCount}`}`);

    console.log(`\n🎯 ${t`Current workspace: ${currentWorkspacePath}`}`);

  } catch (error) {
    logger.error(t`Failed to get workspace list: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function createWorkspace(path: string) {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Creating workspace: ${path}`}`);

    // 检查目录是否已经是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (isWorkspace) {
      logger.warn(t`This directory is already a workspace`);
      return;
    }

    // 创建工作区
    const workspace = await Command.createWorkspace({
      workspacePath: path,
      name: basename(path)
    });

    logger.success(t`✅ Workspace created successfully`);
    console.log(t`Name: ${workspace.name}`);
    console.log(t`Path: ${workspace.path}`);

  } catch (error) {
    logger.error(t`Failed to create workspace: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function showWorkspaceInfo(path: string) {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Viewing workspace info: ${path}`}`);

    // 检查目录是否是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (!isWorkspace) {
      logger.error(t`This directory is not a workspace`);
      return;
    }

    // workspaceManager is already imported
    await workspaceManager.initialize();
    const workspace = workspaceManager.getCurrentWorkspace();
    
    let workspaceConfig= workspace?.getConfig();
    if (!workspaceConfig) {
      logger.error(t`Cannot load workspace configuration`);
      return;
    }

    console.log(`\n📋 ${t`Workspace information:`}`);
    console.log(`  ${t`Name: ${workspaceConfig.name}`}`);
    console.log(`  ${t`Path: ${path}`}`);
    console.log(`  ${t`Description: ${workspaceConfig.description || t`No description`}`}`);
    console.log(`  ${t`Created: ${new Date(workspaceConfig.created).toLocaleString()}`}`);

    // 获取MCP客户端信息
    try {
      const mcpClients = await Command.getWorkspaceMcpClients();
      console.log(`  ${t`MCP clients: ${mcpClients.length} items`}`);
      if (mcpClients.length > 0) {
        mcpClients.forEach(client => {
          console.log(`    - ${client.serverName} (${client.status})`);
        });
      }
    } catch (error) {
      console.log(`  ${t`MCP clients: Failed to get`}`);
    }

  } catch (error) {
    logger.error(t`Failed to get workspace information: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}