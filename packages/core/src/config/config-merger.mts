/**
 * 配置合并管理器
 * 负责将全局配置和工作区配置合并成运行时配置
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { 
  MergedRuntimeConfig, 
  ConfigMergeOptions, 
  ConfigMergeResult,
  ConfigSources,
  MergedSettings 
} from '../../shared/src/types/merged-config.mjs';
import type { AIModelConfigItem, MCPServerConfig, AgentConfig } from '../../shared/src/types.mjs';
import { Command } from '../command.mjs';

/**
 * 配置合并管理器
 */
export class ConfigMerger {
  private static instance?: ConfigMerger;
  
  static getInstance(): ConfigMerger {
    if (!ConfigMerger.instance) {
      ConfigMerger.instance = new ConfigMerger();
    }
    return ConfigMerger.instance;
  }

  /**
   * 合并全局和工作区配置
   */
  async mergeConfigs(
    globalPath: string,
    workspacePath?: string,
    options: ConfigMergeOptions = {}
  ): Promise<ConfigMergeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. 加载全局配置
      const globalConfig = await this.loadGlobalConfig(globalPath);
      if (!globalConfig) {
        errors.push('无法加载全局配置');
        return this.createErrorResult(errors, startTime);
      }

      // 2. 加载工作区配置（如果存在）
      let workspaceConfig: any = null;
      let isProjectWorkspace = false;
      
      if (workspacePath && workspacePath !== globalPath) {
        workspaceConfig = await this.loadWorkspaceConfig(workspacePath);
        isProjectWorkspace = true;
      }

      // 3. 合并配置
      const mergedConfig = await this.performMerge(
        globalConfig,
        workspaceConfig,
        globalPath,
        workspacePath,
        isProjectWorkspace,
        options
      );

      const endTime = Date.now();
      
      return {
        success: true,
        config: mergedConfig,
        errors,
        warnings,
        stats: {
          globalItemsLoaded: this.countConfigItems(globalConfig),
          workspaceItemsLoaded: this.countConfigItems(workspaceConfig || {}),
          finalItemsCount: this.countConfigItems(mergedConfig),
          mergeTimeMs: endTime - startTime
        }
      };

    } catch (error) {
      errors.push(`配置合并失败: ${error instanceof Error ? error.message : String(error)}`);
      return this.createErrorResult(errors, startTime);
    }
  }

  /**
   * 加载全局配置
   */
  private async loadGlobalConfig(globalPath: string): Promise<any | null> {
    try {
      const globalWorkspace = await Command.getGlobalWorkspace();
      const config = {
        aiModels: await this.loadAIModels(globalWorkspace.path),
        mcpClients: await this.loadMCPClients(globalWorkspace.path),
        agents: await this.loadAgents(globalWorkspace.path),
        settings: await this.loadSettings(globalWorkspace.path)
      };
      return config;
    } catch (error) {
      console.error('加载全局配置失败:', error);
      return null;
    }
  }

  /**
   * 加载工作区配置
   */
  private async loadWorkspaceConfig(workspacePath: string): Promise<any | null> {
    try {
      // 检查是否是有效的工作区
      const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: workspacePath });
      if (!isWorkspace) {
        return null;
      }

      const config = {
        aiModels: await this.loadAIModels(workspacePath),
        mcpClients: await this.loadMCPClients(workspacePath),
        agents: await this.loadAgents(workspacePath),
        settings: await this.loadSettings(workspacePath)
      };
      return config;
    } catch (error) {
      console.error('加载工作区配置失败:', error);
      return null;
    }
  }

  /**
   * 执行配置合并
   */
  private async performMerge(
    globalConfig: any,
    workspaceConfig: any | null,
    globalPath: string,
    workspacePath: string | undefined,
    isProjectWorkspace: boolean,
    options: ConfigMergeOptions
  ): Promise<MergedRuntimeConfig> {
    
    // 合并AI模型
    const aiModels = this.mergeAIModels(
      globalConfig.aiModels || [],
      workspaceConfig?.aiModels || [],
      options.overrideGlobalModels ?? true
    );

    // 合并MCP客户端
    const mcpClients = this.mergeMCPClients(
      globalConfig.mcpClients || [],
      workspaceConfig?.mcpClients || [],
      options.mergeMcpClients ?? true
    );

    // 合并Agents
    const agents = this.mergeAgents(
      globalConfig.agents || [],
      workspaceConfig?.agents || [],
      options.mergeAgents ?? true
    );

    // 合并设置
    const settings = this.mergeSettings(
      globalConfig.settings || {},
      workspaceConfig?.settings || {}
    );

    // 创建配置来源信息
    const sources: ConfigSources = {
      globalPath,
      workspacePath,
      isProjectWorkspace,
      loadedAt: new Date(),
      sources: {
        aiModels: workspaceConfig?.aiModels ? 'workspace' : 'global',
        mcpClients: (workspaceConfig?.mcpClients && globalConfig.mcpClients) ? 'merged' : 
                   workspaceConfig?.mcpClients ? 'workspace' : 'global',
        agents: (workspaceConfig?.agents && globalConfig.agents) ? 'merged' :
               workspaceConfig?.agents ? 'workspace' : 'global',
        settings: workspaceConfig?.settings ? 'merged' : 'global'
      }
    };

    return {
      aiModels,
      mcpClients,
      agents,
      settings,
      sources
    };
  }

  /**
   * 合并AI模型配置
   */
  private mergeAIModels(global: AIModelConfigItem[], workspace: AIModelConfigItem[], override: boolean): AIModelConfigItem[] {
    if (override && workspace.length > 0) {
      return workspace; // 工作区完全覆盖
    }
    
    // 合并并去重（基于key）
    const merged = [...global];
    for (const workspaceModel of workspace) {
      if (!merged.find(m => m.key === workspaceModel.key)) {
        merged.push(workspaceModel);
      }
    }
    return merged;
  }

  /**
   * 合并MCP客户端配置
   */
  private mergeMCPClients(
    global: Array<MCPServerConfig & { serverName: string }>, 
    workspace: Array<MCPServerConfig & { serverName: string }>, 
    merge: boolean
  ): Array<MCPServerConfig & { serverName: string }> {
    if (!merge) {
      return workspace.length > 0 ? workspace : global;
    }

    // 合并并去重（基于serverName）
    const merged = [...global];
    for (const workspaceClient of workspace) {
      if (!merged.find(c => c.serverName === workspaceClient.serverName)) {
        merged.push(workspaceClient);
      }
    }
    return merged;
  }

  /**
   * 合并Agent配置
   */
  private mergeAgents(global: AgentConfig[], workspace: AgentConfig[], merge: boolean): AgentConfig[] {
    if (!merge) {
      return workspace.length > 0 ? workspace : global;
    }

    // 合并并去重（基于key）
    const merged = [...global];
    for (const workspaceAgent of workspace) {
      if (!merged.find(a => a.key === workspaceAgent.key)) {
        merged.push(workspaceAgent);
      }
    }
    return merged;
  }

  /**
   * 合并系统设置
   */
  private mergeSettings(global: any, workspace: any): MergedSettings {
    return {
      defaultModel: workspace.defaultModel || global.defaultModel,
      defaultAgent: workspace.defaultAgent || global.defaultAgent,
      enableMCP: workspace.enableMCP ?? global.enableMCP ?? true,
      logLevel: workspace.logLevel || global.logLevel || 'info',
      project: workspace.project || undefined
    };
  }

  /**
   * 加载AI模型配置
   */
  private async loadAIModels(path: string): Promise<AIModelConfigItem[]> {
    try {
      const configFile = join(path, '.hyperchat', 'ai_models.json');
      if (existsSync(configFile)) {
        const content = readFileSync(configFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`加载AI模型配置失败 ${path}:`, error);
    }
    return [];
  }

  /**
   * 加载MCP客户端配置
   */
  private async loadMCPClients(path: string): Promise<Array<MCPServerConfig & { serverName: string }>> {
    try {
      const configFile = join(path, '.hyperchat', 'mcp.json');
      if (existsSync(configFile)) {
        const content = readFileSync(configFile, 'utf8');
        const mcpConfig = JSON.parse(content);
        const mcpServers = mcpConfig.mcpServers || {};
        
        // 将键值对格式转换为数组格式，添加serverName属性
        return Object.entries(mcpServers).map(([serverName, config]) => ({
          serverName,
          ...(config as MCPServerConfig)
        }));
      }
    } catch (error) {
      console.warn(`加载MCP配置失败 ${path}:`, error);
    }
    return [];
  }

  /**
   * 加载Agent配置
   */
  private async loadAgents(path: string): Promise<AgentConfig[]> {
    try {
      const agents = await Command.getWorkspaceAgentsSummary({ workspacePath: path });
      return (agents || []) as AgentConfig[];
    } catch (error) {
      console.warn(`加载Agent配置失败 ${path}:`, error);
    }
    return [];
  }

  /**
   * 加载系统设置
   */
  private async loadSettings(path: string): Promise<any> {
    try {
      const configFile = join(path, '.hyperchat', 'settings.json');
      if (existsSync(configFile)) {
        const content = readFileSync(configFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`加载系统设置失败 ${path}:`, error);
    }
    return {};
  }

  /**
   * 统计配置项数量
   */
  private countConfigItems(config: any): number {
    if (!config) return 0;
    return (config.aiModels?.length || 0) + 
           (config.mcpClients?.length || 0) + 
           (config.agents?.length || 0) + 
           (Object.keys(config.settings || {}).length);
  }

  /**
   * 创建错误结果
   */
  private createErrorResult(errors: string[], startTime: number): ConfigMergeResult {
    return {
      success: false,
      errors,
      warnings: [],
      stats: {
        globalItemsLoaded: 0,
        workspaceItemsLoaded: 0,
        finalItemsCount: 0,
        mergeTimeMs: Date.now() - startTime
      }
    };
  }
}