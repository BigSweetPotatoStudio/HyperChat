/**
 * Run 命令实现
 * 
 * 启动 HyperChat 核心服务但不启动 HTTP 服务器
 * 适用于后台运行、定时任务执行等场景
 */

import process from 'process';
import path from 'path';
import * as fs from 'fs';
import { Logger } from '../utils/logger.mjs';
import "../../first.mjs";
import { getWorkspaceManager, AgentInstance } from "../../workspace/index.mjs";
import { CONSTANTS } from "../../workspace/constants.mjs";
import { t } from '../../i18n.mjs';

/**
 * Agent发现结果
 */
interface DiscoveredAgent {
  name: string;
  path: string;
  source: 'global' | 'local' | 'specified';
  workspacePath?: string;
}

/**
 * 发现系统中所有可用的Agent
 */
async function discoverAgents(options: {
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
async function scanAgentsInDirectory(
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
function deriveWorkspaceFromAgent(agentPath: string): string | undefined {
  // Agent路径结构: workspacePath/.hyperchat/agents/agentName
  const agentsDirIndex = agentPath.indexOf(path.join(CONSTANTS.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS));
  if (agentsDirIndex === -1) {
    return undefined;
  }
  return agentPath.substring(0, agentsDirIndex);
}

export interface RunOptions {
  verbose?: boolean;
  quiet?: boolean;
  workspace?: string;
  agent?: string;          // 指定要启动的Agent名称
  agentPath?: string;      // 指定Agent路径
  listAgents?: boolean;    // 列出可用Agent
}

/**
 * 启动核心服务（Agent优先架构）
 */
export async function startRun(options: RunOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);
  
  try {
    logger.info(`🚀 ${t`Starting Agent-centered core service...`}`);
    
    // 第一阶段：发现系统中可用的Agent
    logger.info(`⏳ ${t`Phase 1: Discovering available agents...`}`);
    const discoveredAgents = await discoverAgents({
      workspace: options.workspace,
      agentPath: options.agentPath
    });
    
    if (options.listAgents) {
      // 列出所有可用Agent并退出
      await listDiscoveredAgents(discoveredAgents, logger);
      return;
    }
    
    if (discoveredAgents.length === 0) {
      logger.warn(`⚠️ ${t`No agents found in the system`}`);
      logger.info(`💡 ${t`Create an agent first using:`} hyperchat agent create <name>`);
      return;
    }
    
    // 确定要启动的Agent
    let targetAgents: DiscoveredAgent[] = [];
    
    if (options.agent) {
      // 启动指定的Agent
      const targetAgent = discoveredAgents.find(a => a.name === options.agent);
      if (!targetAgent) {
        logger.error(`❌ ${t`Agent not found:`} ${options.agent}`);
        logger.info(`💡 ${t`Available agents:`} ${discoveredAgents.map(a => a.name).join(', ')}`);
        return;
      }
      targetAgents = [targetAgent];
    } else if (options.agentPath) {
      // 启动指定路径的Agent
      targetAgents = discoveredAgents.filter(a => a.source === 'specified');
    } else {
      // 默认启动所有发现的Agent
      targetAgents = discoveredAgents;
    }
    
    logger.info(`✅ ${t`Found agents:`} ${discoveredAgents.length}, ${t`will start:`} ${targetAgents.length}`);
    
    // 第二阶段：启动选定的Agent
    logger.info(`⏳ ${t`Phase 2: Starting selected agents...`}`);
    const startedAgents: AgentInstance[] = [];
    
    for (const agentInfo of targetAgents) {
      try {
        logger.info(`🤖 ${t`Starting agent:`} ${agentInfo.name} (${agentInfo.source})`);
        
        // 为每个Agent创建独立的AgentInstance
        const agentInstance = new AgentInstance(agentInfo.path);
        await agentInstance.init();
        
        // 启动Agent的服务
        await agentInstance.startMCPClients();
        await agentInstance.startTaskScheduler();
        
        startedAgents.push(agentInstance);
        
        // 显示Agent启动信息
        const mcpClients = agentInstance.getMCPClients();
        const taskStats = agentInstance.getTaskSchedulerStats();
        
        logger.info(`  ✅ ${t`Agent started:`} ${agentInfo.name}`);
        logger.info(`     📍 ${t`Path:`} ${agentInfo.path}`);
        logger.info(`     🔧 ${t`MCP clients:`} ${mcpClients.length}`);
        logger.info(`     ⏰ ${t`Scheduled tasks:`} ${taskStats.scheduledTasksCount}`);
        
      } catch (error) {
        logger.error(`❌ ${t`Failed to start agent`} ${agentInfo.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    if (startedAgents.length === 0) {
      logger.error(`❌ ${t`No agents started successfully`}`);
      return;
    }
    
    // 显示系统运行状态
    logger.info(`✅ ${t`Agent-centered service is running`}`);
    logger.info(`📊 ${t`System status:`}`);
    logger.info(`   - ${t`Started agents:`} ${startedAgents.length}`);
    
    let totalMcpClients = 0;
    let totalTasks = 0;
    let scheduledTasks: string[] = [];
    
    for (const agent of startedAgents) {
      const mcpClients = agent.getMCPClients();
      totalMcpClients += mcpClients.length;
      
      const tasks = await agent.getTasks();
      totalTasks += tasks.length;
      
      const schedulerStats = agent.getTaskSchedulerStats();
      scheduledTasks.push(...schedulerStats.scheduledTasks);
    }
    
    logger.info(`   - ${t`Total MCP clients:`} ${totalMcpClients}`);
    logger.info(`   - ${t`Total tasks:`} ${totalTasks}`);
    logger.info(`   - ${t`Tasks in scheduling:`} ${scheduledTasks.length}`);
    
    if (scheduledTasks.length > 0) {
      logger.info(`⏰ ${t`Running tasks:`}`);
      for (const taskName of scheduledTasks) {
        logger.info(`   🔄 ${taskName}`);
      }
    }
    
    logger.info(`🔄 ${t`Service started, press Ctrl+C to stop...`}`);
    
    // 保持进程运行，传递startedAgents用于清理
    await keepAlive(startedAgents);
    
  } catch (error) {
    logger.error(`${t`Startup failed:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 列出发现的Agent
 */
async function listDiscoveredAgents(agents: DiscoveredAgent[], logger: Logger): Promise<void> {
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
}

/**
 * 保持进程运行，监听退出信号（Agent优先版本）
 */
async function keepAlive(startedAgents: AgentInstance[] = []): Promise<void> {
  const logger = new Logger();
  
  // 优雅退出处理
  const gracefulExit = async (signal: string) => {
    logger.info(`\n📥 ${t`Received exit signal`} ${signal}, ${t`shutting down agents...`}`);
    
    try {
      // 逐个清理Agent资源
      for (const agent of startedAgents) {
        try {
          const agentName = agent.getConfig().name;
          logger.info(`🛑 ${t`Stopping agent:`} ${agentName}`);
          
          // 停止Agent的MCP客户端
          await agent.stopMCPClients();
          
          // 停止Agent的任务调度器
          const taskScheduler = agent.getTaskScheduler();
          if (taskScheduler) {
            await taskScheduler.stop();
          }
          
          logger.info(`✅ ${t`Agent stopped:`} ${agentName}`);
        } catch (error) {
          logger.warn(`⚠️ ${t`Error stopping agent:`} ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      logger.info(`✅ ${t`All agents shut down safely`}`);
      process.exit(0);
    } catch (error) {
      logger.error(`${t`Error shutting down agents:`} ${error}`);
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
 * 显示运行状态信息（Agent优先版本）
 */
export async function showRunStatus() {
  const logger = new Logger();
  
  try {
    logger.info(`📊 ${t`Agent-centered system status:`}`);
    
    // 发现系统中的所有Agent
    const discoveredAgents = await discoverAgents({});
    
    if (discoveredAgents.length === 0) {
      logger.info(`❌ ${t`No agents found in the system`}`);
      logger.info(`💡 ${t`Create an agent using:`} hyperchat agent create <name>`);
      return;
    }
    
    logger.info(`🔍 ${t`Discovered agents:`} ${discoveredAgents.length}`);
    
    // 尝试检查每个Agent的运行状态
    let runningAgents = 0;
    let totalMcpClients = 0;
    let totalTasks = 0;
    let scheduledTasks: string[] = [];
    
    for (const agentInfo of discoveredAgents) {
      try {
        // 创建临时AgentInstance来检查状态
        const tempAgent = new AgentInstance(agentInfo.path);
        await tempAgent.init();
        
        const mcpClients = tempAgent.getMCPClients();
        const tasks = await tempAgent.getTasks();
        const schedulerStats = tempAgent.getTaskSchedulerStats();
        
        // 统计运行中的Agent（有MCP客户端或调度任务的认为是运行中）
        if (mcpClients.length > 0 || schedulerStats.running) {
          runningAgents++;
        }
        
        totalMcpClients += mcpClients.length;
        totalTasks += tasks.length;
        scheduledTasks.push(...schedulerStats.scheduledTasks);
        
        // 显示每个Agent的状态
        const status = mcpClients.length > 0 || schedulerStats.running ? '🟢' : '⚪';
        logger.info(`   ${status} ${agentInfo.name} (${agentInfo.source})`);
        logger.info(`      📍 ${agentInfo.path}`);
        logger.info(`      🔧 ${t`MCP clients:`} ${mcpClients.length}`);
        logger.info(`      ⏰ ${t`Scheduled tasks:`} ${schedulerStats.scheduledTasksCount}`);
        
      } catch (error) {
        logger.info(`   ❌ ${agentInfo.name} (${agentInfo.source}) - ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 显示总体统计
    logger.info(`\n📊 ${t`System summary:`}`);
    logger.info(`   - ${t`Total agents:`} ${discoveredAgents.length}`);
    logger.info(`   - ${t`Active agents:`} ${runningAgents}`);
    logger.info(`   - ${t`Total MCP clients:`} ${totalMcpClients}`);
    logger.info(`   - ${t`Total tasks:`} ${totalTasks}`);
    logger.info(`   - ${t`Tasks in scheduling:`} ${scheduledTasks.length}`);
    
    if (scheduledTasks.length > 0) {
      logger.info(`\n⏰ ${t`Running tasks:`}`);
      for (const taskName of scheduledTasks) {
        logger.info(`   🔄 ${taskName}`);
      }
    }
    
    if (runningAgents === 0) {
      logger.info(`\n💡 ${t`No agents are currently running. Start agents using:`}`);
      logger.info(`   hyperchat run                    # ${t`Start all agents`}`);
      logger.info(`   hyperchat run --agent <name>     # ${t`Start specific agent`}`);
    }
    
  } catch (error) {
    logger.error(`${t`Failed to get status:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}