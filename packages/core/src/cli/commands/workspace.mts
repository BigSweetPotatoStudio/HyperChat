/**
 * Workspace 命令实现
 */

import process from 'process';
import { basename } from 'path';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import { t } from '../../i18n.mjs';
import { appDataDir } from '../../const.mjs';
/**
 * 获取当前工作区路径（新架构）
 */
async function getCurrentWorkspacePath(): Promise<string> {

  // workspaceManager is already imported
  const currentWorkingDirectory = process.cwd();
  let workspace = await workspaceManager.initialize(currentWorkingDirectory);
  return workspace.workspacePath;
}

export async function listWorkspaces() {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Getting workspace information...`}`);

    // 获取当前工作路径（命令运行的目录）
    const currentWorkingDirectory = process.cwd();

    // 获取当前工作区路径（配置所在的目录）
    const currentWorkspacePath = await getCurrentWorkspacePath();

    // 新架构：只显示当前工作区
    const currentWorkspace = await Command.getCurrentWorkspace();

    console.log(`\n📍 ${t`Current working directory:`} ${currentWorkingDirectory}`);
    console.log(`📁 ${t`Current workspace:`} ${currentWorkspacePath}`);

    if (currentWorkingDirectory !== currentWorkspacePath) {
      console.log(`   ${t`(Configuration loaded from workspace above)`}`);
    } else {
      console.log(`   ${t`(Running in workspace root)`}`);
    }

    console.log(`\n📋 ${t`Workspace details:`}`);

    if (!currentWorkspace) {
      console.log(`  ${t`No workspace found`}`);
      return;
    }

    const type = currentWorkspace.isGlobal ? t`(Global)` : t`(Project)`;
    console.log(`  🏷️  ${t`Name:`} ${currentWorkspace.name} ${type}`);
    console.log(`  📂 ${t`Config path:`} ${currentWorkspace.path}`);
    if (currentWorkspace.description) {
      console.log(`  📝 ${t`Description:`} ${currentWorkspace.description}`);
    }
    console.log(`  🤖 ${t`Agents:`} ${currentWorkspace.agentsCount}`);
    console.log(`  🔧 ${t`MCP services:`} ${currentWorkspace.mcpServersCount}`);

  } catch (error) {
    logger.error(`${t`Failed to get workspace information:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function showCurrentWorkspace() {
  const logger = new Logger();

  try {
    // 初始化工作区管理器
    const currentWorkingDirectory = process.cwd();
    let workspace = await workspaceManager.initialize(currentWorkingDirectory);


    console.log(`\n🎯 ${t`Current Status:`}`);
    console.log(`📍 ${t`Working Directory:`} ${currentWorkingDirectory}`);
    console.log(`📁 ${t`Workspace:`} ${workspace.workspacePath}`);

    if (workspace.exists()) {
      console.log(`\n✅ ${t`Using local workspace with .hyperchat directory.`}`);
    } else if (workspace.isGlobal()) {
      console.log(`\n🌐 ${t`Using global workspace.`}`);
    } else {
      console.log(`\n💡 ${t`No .hyperchat directory found in current path.`}`);
    }

    const config = workspace.getConfig();
    if (config) {
      const type = workspace.workspacePath === appDataDir ? t`Global Workspace` : t`Project Workspace`;
      console.log(`\n📋 ${t`Workspace Type:`} ${type}`);
      console.log(`🏷️  ${t`Name:`} ${config.name}`);
      if (config.description) {
        console.log(`📝 ${t`Description:`} ${config.description}`);
      }
    }

  } catch (error) {
    logger.error(`${t`Failed to get current workspace status:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function createWorkspace(path: string) {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Creating workspace:`} ${path}`);

    // 检查目录是否已经是工作区
    const isWorkspace = await workspaceManager.isWorkspaceDirectory(path);
    if (isWorkspace) {
      logger.warn(t`This directory is already a workspace`);
      return;
    }

    // 创建工作区
    await workspaceManager.switchWorkspace(
      path,
      true
    );
    const workspace = workspaceManager.getCurrentWorkspace();
    logger.success(t`✅ Workspace created successfully`);
    console.log(`${t`Path:`} ${workspace.workspacePath}`);

  } catch (error) {
    logger.error(`${t`Failed to create workspace:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function showWorkspaceInfo(path: string) {
  const logger = new Logger();

  try {
    logger.info(`📁 ${t`Viewing workspace info:`} ${path}`);

    // 检查目录是否是工作区
    const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: path });
    if (!isWorkspace) {
      logger.error(t`This directory is not a workspace`);
      return;
    }

    // workspaceManager is already imported
    await workspaceManager.initialize(process.cwd());
    const workspace = workspaceManager.getCurrentWorkspace();

    let workspaceConfig = workspace?.getConfig();
    if (!workspaceConfig) {
      logger.error(t`Cannot load workspace configuration`);
      return;
    }

    console.log(`\n📋 ${t`Workspace information:`}`);
    console.log(`  ${t`Name:`} ${workspaceConfig.name}`);
    console.log(`  ${t`Path:`} ${path}`);
    console.log(`  ${t`Description:`} ${workspaceConfig.description || t`No description`}`);
    console.log(`  ${t`Created:`} ${new Date(workspaceConfig.created).toLocaleString()}`);

    // 获取MCP客户端信息
    try {
      const mcpClients = await Command.getWorkspaceMcpClients();
      console.log(`  ${t`MCP clients:`} ${mcpClients.length} ${t`items`}`);
      if (mcpClients.length > 0) {
        mcpClients.forEach(client => {
          console.log(`    - ${client.serverName} (${client.status})`);
        });
      }
    } catch (error) {
      console.log(`  ${t`MCP clients: Failed to get`}`);
    }

  } catch (error) {
    logger.error(`${t`Failed to get workspace information:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}