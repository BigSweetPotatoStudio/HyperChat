/**
 * Run 命令实现
 * 
 * 启动 HyperChat 核心服务但不启动 HTTP 服务器
 * 适用于后台运行、定时任务执行等场景
 */

import process from 'process';
import path from 'path';
import { Logger } from '../utils/logger.mjs';
import "../../first.mjs";
import { getWorkspaceManager, AgentInstance } from "../../workspace/index.mjs";
import { getAgent } from '../agentManager.mjs';
import { t } from '../../i18n.mjs';
import { 
  discoverAgents, 
  listDiscoveredAgents,
  findAgent,
  DEFAULT_AGENT_NAME,
  type DiscoveredAgent 
} from '../utils/agentDiscovery.mjs';


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
    
    // 第一步：加载环境变量配置（Agent-centered架构）
    logger.info(`⏳ ${t`Step 1: Loading Agent-centered environment configuration...`}`);
    let envManager;
    if (options.agentPath) {
      // 如果指定了Agent路径，使用Agent-centered配置
      const { EnvManager } = await import('../../data/managers/envManager.mjs');
      envManager = EnvManager.getInstance(options.agentPath);
      logger.info(`🔧 ${t`Using Agent-centered environment:`} ${options.agentPath}`);
      if (options.verbose) {
        envManager.logDetailedConfig();
      }
    } else {
      // 使用默认的全局环境配置
      const { EnvManager } = await import('../../data/managers/envManager.mjs');
      envManager = EnvManager.getInstance();
      logger.info(`🔧 ${t`Using global environment configuration`}`);
    }
    
    // 第二阶段：发现系统中可用的Agent
    logger.info(`⏳ ${t`Step 2: Discovering available agents...`}`);
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
    
    // 第三阶段：使用CliAgentManager启动单个Agent
    logger.info(`⏳ ${t`Step 3: Starting agent with CliAgentManager...`}`);
    
    try {
      // 使用CliAgentManager获取和初始化Agent
      const agentInstance = await getAgent({
        agentName: options.agent,
        agentPath: options.agentPath,
        workspace: options.workspace,
        enableTaskScheduler: true // run命令默认启用任务调度器
      });
      
      const config = agentInstance.getConfig();
      logger.info(`🤖 ${t`Agent started:`} ${config.name}`);
      
      // 显示Agent启动信息
      const mcpClients = agentInstance.getMCPClients();
      const taskStats = agentInstance.getTaskSchedulerStats();
      
      logger.info(`  ✅ ${t`Agent initialized successfully`}`);
      logger.info(`     📍 ${t`Path:`} ${agentInstance.getAgentPath()}`);
      logger.info(`     🔧 ${t`MCP clients:`} ${mcpClients.length}`);
      logger.info(`     ⏰ ${t`Scheduled tasks:`} ${taskStats.scheduledTasksCount}`);
      
      // 显示系统运行状态
      logger.info(`✅ ${t`Agent-centered service is running`}`);
      logger.info(`📊 ${t`Agent status:`}`);
      logger.info(`   - ${t`Agent name:`} ${config.name}`);
      logger.info(`   - ${t`Agent path:`} ${agentInstance.getAgentPath()}`);
      logger.info(`   - ${t`MCP clients:`} ${mcpClients.length}`);
      
      const tasks = await agentInstance.getTasks();
      const schedulerStats = agentInstance.getTaskSchedulerStats();
      logger.info(`   - ${t`Total tasks:`} ${tasks.length}`);
      logger.info(`   - ${t`Tasks in scheduling:`} ${schedulerStats.scheduledTasksCount}`);
      
      if (schedulerStats.scheduledTasks.length > 0) {
        logger.info(`⏰ ${t`Running tasks:`}`);
        for (const taskName of schedulerStats.scheduledTasks) {
          logger.info(`   🔄 ${taskName}`);
        }
      }
      
      logger.info(`🔄 ${t`Service started, press Ctrl+C to stop...`}`);
      
      // 保持进程运行，传递单个Agent用于清理
      await keepAlive([agentInstance]);
      
    } catch (error) {
      logger.error(`❌ ${t`Failed to start agent:`} ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    
  } catch (error) {
    logger.error(`${t`Startup failed:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
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