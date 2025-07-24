/**
 * Agent发现公共逻辑
 * 提供统一的Agent发现、扫描和选择功能
 */

import * as path from 'path';
import * as fs from 'fs';
import { CONSTANTS } from '../../workspace/constants.mjs';
import { t } from '../../i18n.mjs';

/**
 * Agent发现结果
 */
export interface DiscoveredAgent {
  name: string;
  path: string;
  source: 'global' | 'local' | 'specified';
  workspacePath?: string;
}

/**
 * 发现系统中所有可用的Agent
 */
export async function discoverAgents(options: {
  workspace?: string;
  agentPath?: string;
}): Promise<DiscoveredAgent[]> {
  const agents: DiscoveredAgent[] = [];
  
  // 1. 如果指定了具体的Agent路径
  if (options.agentPath && fs.existsSync(options.agentPath)) {
    const agentConfigPath = path.join(options.agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
    if (fs.existsSync(agentConfigPath)) {
      agents.push({
        name: path.basename(options.agentPath),
        path: options.agentPath,
        source: 'specified',
        workspacePath: deriveWorkspaceFromAgent(options.agentPath)
      });
    }
  }
  
  // 2. 从全局路径发现Agent
  const globalAgentsPath = path.join(CONSTANTS.GLOBAL_HYPERCHAT_DIR_PATH, CONSTANTS.DIRECTORIES.AGENTS);
  if (fs.existsSync(globalAgentsPath)) {
    const globalAgents = await scanAgentsInDirectory(globalAgentsPath, 'global');
    agents.push(...globalAgents);
  }
  
  // 3. 从当前工作区路径发现Agent
  const workspacePath = options.workspace ? path.resolve(options.workspace) : process.cwd();
  const localAgentsPath = path.join(workspacePath, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS);
  if (fs.existsSync(localAgentsPath)) {
    const localAgents = await scanAgentsInDirectory(localAgentsPath, 'local', workspacePath);
    agents.push(...localAgents);
  }
  
  return agents;
}

/**
 * 扫描目录中的Agent
 */
export async function scanAgentsInDirectory(
  agentsDir: string, 
  source: 'global' | 'local', 
  workspacePath?: string
): Promise<DiscoveredAgent[]> {
  const agents: DiscoveredAgent[] = [];
  
  try {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const agentPath = path.join(agentsDir, entry.name);
        const configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
        
        if (fs.existsSync(configPath)) {
          agents.push({
            name: entry.name,
            path: agentPath,
            source,
            workspacePath: workspacePath || deriveWorkspaceFromAgent(agentPath)
          });
        }
      }
    }
  } catch (error) {
    // 扫描失败不影响整体流程
  }
  
  return agents;
}

/**
 * 从Agent路径推导工作区路径
 */
export function deriveWorkspaceFromAgent(agentPath: string): string | undefined {
  // Agent路径结构: workspacePath/.hyperchat/agents/agentName
  const agentsDirIndex = agentPath.indexOf(path.join(CONSTANTS.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS));
  if (agentsDirIndex === -1) {
    return undefined;
  }
  return agentPath.substring(0, agentsDirIndex);
}

/**
 * 格式化显示发现的Agent列表
 */
export async function listDiscoveredAgents(agents: DiscoveredAgent[], logger: any): Promise<void> {
  logger.info(`📋 ${t`Available agents:`} ${agents.length}`);
  
  if (agents.length === 0) {
    logger.info(`💡 ${t`No agents found. Create one using:`} hyperchat agent create <name>`);
    return;
  }
  
  // 按来源分组显示
  const globalAgents = agents.filter(a => a.source === 'global');
  const localAgents = agents.filter(a => a.source === 'local');
  const specifiedAgents = agents.filter(a => a.source === 'specified');
  
  if (globalAgents.length > 0) {
    logger.info(`\n🌍 ${t`Global agents:`} ${globalAgents.length}`);
    for (const agent of globalAgents) {
      logger.info(`   🤖 ${agent.name}`);
      logger.info(`      📍 ${agent.path}`);
    }
  }
  
  if (localAgents.length > 0) {
    logger.info(`\n📁 ${t`Local agents:`} ${localAgents.length}`);
    for (const agent of localAgents) {
      logger.info(`   🤖 ${agent.name}`);
      logger.info(`      📍 ${agent.path}`);
      if (agent.workspacePath) {
        logger.info(`      🏠 ${t`Workspace:`} ${agent.workspacePath}`);
      }
    }
  }
  
  if (specifiedAgents.length > 0) {
    logger.info(`\n🎯 ${t`Specified agents:`} ${specifiedAgents.length}`);
    for (const agent of specifiedAgents) {
      logger.info(`   🤖 ${agent.name}`);
      logger.info(`      📍 ${agent.path}`);
    }
  }
  
  logger.info(`\n💡 ${t`Usage examples:`}`);
  logger.info(`   hyperchat run --agent ${agents[0].name}    # ${t`Start specific agent`}`);
  logger.info(`   hyperchat run                               # ${t`Start all agents`}`);
  logger.info(`   hyperchat chat --agent ${agents[0].name}   # ${t`Chat with specific agent`}`);
}