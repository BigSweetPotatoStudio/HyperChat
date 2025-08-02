import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";

import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig } from "@dadigua/hyperchat-shared";
import { AgentInstance } from "../agent/agentInstance.mjs";

// AgentInstance 已迁移到单独的文件 agentInstance.mts

/**
 * Agent管理器类 - 基于路径数组管理所有Agent实例（延迟加载）
 */
export class AgentManager {
  private agentPaths: string[];
  private agents: Map<string, AgentInstance> = new Map(); // agentPath -> AgentInstance (缓存已加载的)
  private nameToPath: Map<string, string> = new Map(); // name -> agentPath (路径索引)
  private availableAgents: Map<string, string> = new Map(); // name -> agentPath (可用Agent目录)

  constructor(agentPaths: string | string[]) {
    // 支持单个路径或路径数组
    this.agentPaths = Array.isArray(agentPaths) ? agentPaths : [agentPaths];
  }

  /**
   * 初始化Agent管理器（延迟加载模式：只扫描目录，不加载Agent实例）
   */
  async init(): Promise<void> {
    // 只扫描可用的Agent目录，不创建实例
    await this.scanAvailableAgents();
  }

  /**
   * 扫描可用的Agent目录（不加载实例，只记录路径）
   */
  private async scanAvailableAgents(): Promise<void> {
    // 清空现有数据
    this.availableAgents.clear();
    this.nameToPath.clear();
    // 保留已加载的Agent缓存

    // 从所有配置的路径中扫描Agent目录
    for (const agentsBasePath of this.agentPaths) {
      if (!fs.existsSync(agentsBasePath)) {
        continue;
      }

      try {
        const entries = await fs.promises.readdir(agentsBasePath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const agentPath = path.join(agentsBasePath, entry.name);
            
            // 检查是否为有效的Agent目录（存在agent.yaml）
            const configPath = path.join(agentPath, 'agent.yaml');
            if (fs.existsSync(configPath)) {
              // 只记录路径，不创建实例
              const agentName = path.basename(agentPath);
              this.availableAgents.set(agentName, agentPath);
              // 后加载的同名Agent会覆盖先加载的（通常是工作区覆盖全局）
              this.nameToPath.set(agentName, agentPath);
            }
          }
        }
      } catch (error) {
        console.warn(`扫描Agent目录失败 ${agentsBasePath}:`, error);
      }
    }
  }


  /**
   * 创建安全的文件夹名称
   */
  private createSafeFolderName(name: string): string {
    // 使用通用的文件名安全化函数
    return sanitizeFileName(name, 50); // 限制为50字符
  }

  /**
   * 生成唯一的Agent文件夹名称（在指定的基础路径下）
   */
  private async generateUniqueAgentFolderName(baseName: string, basePath: string): Promise<string> {
    let folderName = this.createSafeFolderName(baseName);
    let counter = 1;

    while (fs.existsSync(path.join(basePath, folderName))) {
      folderName = `${this.createSafeFolderName(baseName)}_${counter}`;
      counter++;
    }

    return folderName;
  }

  /**
   * 获取Agent的路径（基于名称）
   */
  getAgentPath(name: string): string | null {
    return this.nameToPath.get(name) || null;
  }

  /**
   * 创建新的 Agent（在指定的基础路径下创建，默认使用第一个路径）
   */
  async createAgent(config: Partial<AgentConfig>, targetBasePath?: string): Promise<AgentInstance | null> {
    // 确定目标基础路径：如果未指定，使用第一个配置的路径
    const basePath = targetBasePath || this.agentPaths[0];

    // 确保目标 agents 目录存在（懒加载模式）
    if (!fs.existsSync(basePath)) {
      await fs.promises.mkdir(basePath, { recursive: true });
    }

    const name = config.name || `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;

    // 生成唯一的文件夹名称
    const folderName = await this.generateUniqueAgentFolderName(name, basePath);
    const agentPath = path.join(basePath, folderName);

    // 检查是否已存在同名Agent
    if (this.nameToPath.has(name)) {
      console.warn(`Agent "${name}" 已存在于路径: ${this.nameToPath.get(name)}`);
      return null;
    }

    const agentConfig: AgentConfig = {
      ...config,
      name,
      prompt: config.prompt || '',
      allowMCPs: config.allowMCPs || [],
      blockMCPTools: config.blockMCPTools || [],
      isConfirmCallTool: config.isConfirmCallTool ?? false,
      maxTokens: config.maxTokens || 4000,
      tags: config.tags || [],
      subAgents: config.subAgents || [],
      version: config.version || 1
    };

    try {
      const agent = new AgentInstance(agentPath, agentConfig);
      await agent.init();
      await agent.saveConfig();

      // 更新所有映射
      this.agents.set(agentPath, agent);
      this.nameToPath.set(name, agentPath);
      this.availableAgents.set(name, agentPath);
      return agent;
    } catch (error) {
      console.warn(`创建 Agent 失败 ${name}:`, error);
      return null;
    }
  }

  /**
   * 获取Agent实例（延迟加载）
   */
  getAgent(nameOrPath: string): AgentInstance | null {
    // 先从缓存中查找
    if (this.agents.has(nameOrPath)) {
      return this.agents.get(nameOrPath)!;
    }

    // 通过名称查找路径
    let agentPath = nameOrPath;
    if (!nameOrPath.includes('/')) {
      // 是名称，需要转换为路径
      const foundPath = this.nameToPath.get(nameOrPath);
      if (!foundPath) {
        return null; // Agent不存在
      }
      agentPath = foundPath;
    }

    // 延迟加载Agent实例
    return this.loadAgentInstance(agentPath);
  }

  /**
   * 延迟加载Agent实例（返回未初始化的实例，在使用时才初始化）
   */
  private loadAgentInstance(agentPath: string): AgentInstance | null {
    // 检查缓存
    if (this.agents.has(agentPath)) {
      return this.agents.get(agentPath)!;
    }

    try {
      const agent = new AgentInstance(agentPath);
      if (agent.exists()) {
        // 缓存Agent实例（还未初始化）
        this.agents.set(agentPath, agent);
        return agent;
      }
    } catch (error) {
      console.warn(`加载Agent实例失败 ${agentPath}:`, error);
    }

    return null;
  }

  /**
   * 获取Agent实例(通过名称，保持向后兼容)
   */
  getAgentByName(name: string): AgentInstance | null {
    return this.getAgent(name);
  }

  /**
   * 获取所有Agent配置（延迟加载所有Agent）
   */
  async getAllAgents(): Promise<(AgentConfig & { agentPath?: string })[]> {
    const configs: (AgentConfig & { agentPath?: string })[] = [];
    
    // 遍历所有可用的Agent
    for (const [name, agentPath] of this.availableAgents.entries()) {
      const agent = this.getAgent(name);
      if (agent) {
        const config = agent.getConfig();
        configs.push({
          ...config,
          agentPath: agentPath
        });
      }
    }
    
    return configs;
  }

  /**
   * 删除 Agent（通过名称或路径）
   */
  async deleteAgent(nameOrPath: string): Promise<boolean> {
    let agentPath: string;
    let agent: AgentInstance;

    // 检查是否是完整路径
    if (this.agents.has(nameOrPath)) {
      agentPath = nameOrPath;
      agent = this.agents.get(nameOrPath)!;
    } else {
      // 当作名称查找
      const path = this.nameToPath.get(nameOrPath);
      if (!path || !this.agents.has(path)) {
        return false;
      }
      agentPath = path;
      agent = this.agents.get(path)!;
    }

    const config = agent.getConfig();
    const success = await agent.delete();
    if (success) {
      // 更新所有映射
      this.agents.delete(agentPath);
      if (this.nameToPath.get(config.name) === agentPath) {
        this.nameToPath.delete(config.name);
      }
      if (this.availableAgents.get(config.name) === agentPath) {
        this.availableAgents.delete(config.name);
      }
    }
    return success;
  }

  /**
   * 通过名称删除 Agent（保持向后兼容）
   */
  async deleteAgentByName(name: string): Promise<boolean> {
    return await this.deleteAgent(name);
  }

  /**
   * 获取Agent数量（基于可用Agent目录）
   */
  getAgentsCount(): number {
    return this.availableAgents.size;
  }

  /**
   * 获取所有Agent的摘要信息（延迟加载）
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig & { agentPath?: string };
    chatLogsCount: number;
    lastChatTime?: number;
    hasMCPConfig: boolean;
  }>> {
    const summaries: Array<{
      config: AgentConfig & { agentPath?: string };
      chatLogsCount: number;
      lastChatTime?: number;
      hasMCPConfig: boolean;
    }> = [];
    
    // 遍历所有可用的Agent
    for (const [name, agentPath] of this.availableAgents.entries()) {
      const agent = this.getAgent(name);
      if (agent) {
        const summary = await agent.getSummary();
        summaries.push({
          ...summary,
          config: {
            ...summary.config,
            agentPath: agentPath
          }
        });
      }
    }
    
    return summaries;
  }

  /**
   * 更新 Agent 的内部映射关系（当名称变更时）
   */
  async updateAgentMapping(oldName: string, newName: string): Promise<void> {
    // 通过旧名称获取Agent路径
    const agentPath = this.nameToPath.get(oldName);
    if (!agentPath) {
      console.warn(`尝试更新不存在的 Agent 映射: ${oldName} -> ${newName}`);
      return;
    }

    // 获取Agent实例
    const agentInstance = this.agents.get(agentPath);
    if (!agentInstance) {
      console.warn(`Agent实例不存在: ${agentPath}`);
      return;
    }

    // 更新 nameToPath Map：删除旧的名称映射，添加新的
    this.nameToPath.delete(oldName);
    this.nameToPath.set(newName, agentPath);

    // 更新 availableAgents Map：删除旧的名称映射，添加新的
    this.availableAgents.delete(oldName);
    this.availableAgents.set(newName, agentPath);

    console.log(`已更新 Agent 映射关系: ${oldName} -> ${newName} (路径: ${agentPath})`);
  }

  /**
   * 获取所有配置的Agent基础路径
   */
  getAgentPaths(): string[] {
    return [...this.agentPaths];
  }
}