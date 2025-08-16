/**
 * 默认Agent创建和发现工具
 * 确保Hyper Agent始终可用：优先本地 > 全局 > 自动创建
 */

import * as path from 'path';
import * as fs from 'fs';
import { CONSTANTS } from '../../agent/constants.mjs';
import { EnvManager } from '../../data/managers/envManager.mjs';
import { t } from '../../i18n.mjs';
import { Logger } from '../utils/logger.mjs';
import type { DiscoveredAgent } from './agentDiscovery.mjs';
import { AgentInstance } from '../../agent/agentInstance.mjs';
import type { AgentConfig } from '@dadigua/hyperchat-shared';
import { WorkSpaceServers } from '../../mcp/servers/index.mjs';

/**
 * 默认Agent名称
 */
export const DEFAULT_AGENT_NAME = 'Hyper';

/**
 * 默认Agent配置模板（AgentConfig格式）
 */
function createDefaultAgentConfig(): AgentConfig {
  return {
    name: DEFAULT_AGENT_NAME,
    prompt: "You are Hyper, a helpful AI assistant created by HyperChat. You are knowledgeable, friendly, and always ready to help users with their questions and tasks.",
    allowMCPs: WorkSpaceServers.map(server => server.name),
    blockMCPTools: [],
    isConfirmCallTool: false,
    maxTokens: 4000,
    maxContextTokens: 32000,
    tags: ['default', 'assistant'],
    subAgents: [],
    version: 1,
    temperature: 0.7,
    description: "HyperChat default AI assistant"
  };
}

/**
 * 寻找默认Agent：本地 > 全局 > 创建
 */
export async function findOrCreateDefaultAgent(options: {
  workspacePath?: string;
  logger?: Logger;
}): Promise<DiscoveredAgent> {
  const logger = options.logger || new Logger(false, false);
  
  // 1. 优先查找本地工作区中的Hyper Agent
  if (options.workspacePath) {
    const localAgent = await findLocalDefaultAgent(options.workspacePath);
    if (localAgent) {
      logger.debug(`${t`Found local default agent:`} ${localAgent.path}`);
      return localAgent;
    }
  }
  
  // 2. 查找全局Hyper Agent
  const globalAgent = await findGlobalDefaultAgent();
  if (globalAgent) {
    logger.debug(`${t`Found global default agent:`} ${globalAgent.path}`);
    return globalAgent;
  }
  
  // 3. 如果都没找到，创建全局默认Agent
  logger.info(`${t`Default agent not found, creating global default agent...`}`);
  const createdAgent = await createGlobalDefaultAgent();
  logger.info(`✅ ${t`Created default agent:`} ${createdAgent.path}`);
  
  return createdAgent;
}

/**
 * 在本地工作区查找默认Agent
 */
async function findLocalDefaultAgent(workspacePath: string): Promise<DiscoveredAgent | null> {
  const localAgentPath = path.join(
    workspacePath, 
    CONSTANTS.HYPERCHAT_DIR, 
    CONSTANTS.DIRECTORIES.AGENTS, 
    DEFAULT_AGENT_NAME
  );
  
  const configPath = path.join(localAgentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
  
  if (fs.existsSync(configPath)) {
    return {
      name: DEFAULT_AGENT_NAME,
      path: localAgentPath,
      source: 'local',
      workspacePath
    };
  }
  
  return null;
}

/**
 * 在全局查找默认Agent
 */
async function findGlobalDefaultAgent(): Promise<DiscoveredAgent | null> {
  // 获取全局数据目录
  const envManager = EnvManager.getInstance();
  envManager.initBase(); // 初始化基础环境获取全局路径
  
  const globalDataDir = envManager.getActualGlobalDataDir();
  const globalAgentPath = path.join(
    globalDataDir,
    CONSTANTS.HYPERCHAT_DIR,
    CONSTANTS.DIRECTORIES.AGENTS,
    DEFAULT_AGENT_NAME
  );
  
  const configPath = path.join(globalAgentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
  
  if (fs.existsSync(configPath)) {
    return {
      name: DEFAULT_AGENT_NAME,
      path: globalAgentPath,
      source: 'global'
    };
  }
  
  return null;
}

/**
 * 创建全局默认Agent
 */
async function createGlobalDefaultAgent(): Promise<DiscoveredAgent> {
  // 获取全局数据目录
  const envManager = EnvManager.getInstance();
  envManager.initBase(); // 初始化基础环境
  
  const globalDataDir = envManager.getActualGlobalDataDir();
  const globalAgentPath = path.join(
    globalDataDir,
    CONSTANTS.HYPERCHAT_DIR,
    CONSTANTS.DIRECTORIES.AGENTS,
    DEFAULT_AGENT_NAME
  );
  
  // 使用 AgentInstance 静态方法创建默认Agent
  const defaultConfig = createDefaultAgentConfig();
  await AgentInstance.createAgent(globalAgentPath, defaultConfig);
  
  return {
    name: DEFAULT_AGENT_NAME,
    path: globalAgentPath,
    source: 'global'
  };
}

/**
 * 检查默认Agent是否存在
 */
export async function checkDefaultAgentExists(workspacePath?: string): Promise<{
  exists: boolean;
  location: 'local' | 'global' | 'none';
  path?: string;
}> {
  // 检查本地
  if (workspacePath) {
    const localAgent = await findLocalDefaultAgent(workspacePath);
    if (localAgent) {
      return {
        exists: true,
        location: 'local',
        path: localAgent.path
      };
    }
  }
  
  // 检查全局
  const globalAgent = await findGlobalDefaultAgent();
  if (globalAgent) {
    return {
      exists: true,
      location: 'global',
      path: globalAgent.path
    };
  }
  
  return {
    exists: false,
    location: 'none'
  };
}

/**
 * 确保默认Agent配置是最新的
 * 使用 AgentInstance 方法重新创建配置
 */
export async function ensureDefaultAgentConfig(agentPath: string): Promise<void> {
  const configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
  
  if (!fs.existsSync(configPath)) {
    // 如果配置文件不存在，使用 AgentInstance 创建
    const defaultConfig = createDefaultAgentConfig();
    await AgentInstance.createAgent(agentPath, defaultConfig);
  }
  
  // 对于现有配置文件，保持不变，避免覆盖用户自定义的设置
}