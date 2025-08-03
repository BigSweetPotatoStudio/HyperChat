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

/**
 * 默认Agent名称
 */
export const DEFAULT_AGENT_NAME = 'Hyper';

/**
 * 默认Agent配置模板（YAML格式）
 */
const DEFAULT_AGENT_CONFIG_YAML = `name: ${DEFAULT_AGENT_NAME}
description: "HyperChat default AI assistant"
model: "moonshot-v2"
provider: "moonshot"
temperature: 0.7
maxTokens: 4000
systemPrompt: "You are Hyper, a helpful AI assistant created by HyperChat. You are knowledgeable, friendly, and always ready to help users with their questions and tasks."
tools: []
enabled: true
created: "${new Date().toISOString()}"
updated: "${new Date().toISOString()}"
`;

/**
 * 默认Agent记忆模板
 */
const DEFAULT_AGENT_MEMORY = `# ${DEFAULT_AGENT_NAME} Agent Memory

This is the default HyperChat AI assistant. I'm here to help you with various tasks and questions.

## My Capabilities
- General conversation and assistance
- Code help and programming questions  
- Information lookup and research
- Task planning and organization
- Creative writing and brainstorming

## Personality
- Helpful and friendly
- Professional but approachable
- Clear and concise communication
- Always ready to learn and adapt

---
*This memory was automatically created by HyperChat CLI.*
`;

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
  
  // 创建Agent目录
  fs.mkdirSync(globalAgentPath, { recursive: true });
  
  // 创建Agent配置文件
  const configPath = path.join(globalAgentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
  fs.writeFileSync(configPath, DEFAULT_AGENT_CONFIG_YAML, 'utf8');
  
  // 创建Agent记忆文件
  const memoryPath = path.join(globalAgentPath, 'memory.md');
  fs.writeFileSync(memoryPath, DEFAULT_AGENT_MEMORY, 'utf8');
  
  // 创建聊天记录目录
  const chatLogsDir = path.join(globalAgentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS);
  fs.mkdirSync(chatLogsDir, { recursive: true });
  
  // 创建子Agent目录（为将来扩展准备）
  const subAgentsDir = path.join(globalAgentPath, 'sub_agents');
  fs.mkdirSync(subAgentsDir, { recursive: true });
  
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
 * 由于使用YAML格式，这里简化为检查文件存在性
 */
export async function ensureDefaultAgentConfig(agentPath: string): Promise<void> {
  const configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
  
  if (!fs.existsSync(configPath)) {
    // 如果配置文件不存在，创建它
    fs.writeFileSync(configPath, DEFAULT_AGENT_CONFIG_YAML, 'utf8');
  }
  
  // 对于YAML格式，我们保持简单，只确保文件存在
  // 如果需要更复杂的配置更新，可以在这里使用YAML解析库
}