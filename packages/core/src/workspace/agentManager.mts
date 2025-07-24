import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";

import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig } from "@dadigua/hyperchat-shared";
import { AgentInstance } from "./agentInstance.mjs";

// AgentInstance 已迁移到单独的文件 agentInstance.mts

/**
 * Agent 管理器类 - 基于路径数组管理所有 Agent 实例
 */
export class AgentManager {
  private agentPaths: string[];
  private agents: Map<string, AgentInstance> = new Map(); // agentPath -> AgentInstance
  private nameToPath: Map<string, string> = new Map(); // name -> agentPath

  constructor(agentPaths: string | string[]) {
    // 支持单个路径或路径数组
    this.agentPaths = Array.isArray(agentPaths) ? agentPaths : [agentPaths];
  }

  /**
   * 初始化 Agent 管理器（不自动创建目录，采用懒加载模式）
   */
  async init(): Promise<void> {
    // 不自动创建 agents 目录，采用懒加载模式：只有需要时才创建
    await this.loadAllAgents();
  }

  /**
   * 加载所有 Agent（从配置的路径数组中扫描）
   */
  private async loadAllAgents(): Promise<void> {
    // 清空现有数据
    this.agents.clear();
    this.nameToPath.clear();

    // 从所有配置的路径中加载Agent，后加载的同名Agent会覆盖先加载的
    for (const agentsBasePath of this.agentPaths) {
      if (!fs.existsSync(agentsBasePath)) {
        continue;
      }

      try {
        const entries = await fs.promises.readdir(agentsBasePath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const agentPath = path.join(agentsBasePath, entry.name);
            const agent = new AgentInstance(agentPath);

            if (agent.exists()) {
              await agent.init();
              const config = agent.getConfig();

              // 使用完整的agentPath作为唯一标识
              this.agents.set(agentPath, agent);
              // 同名Agent会被后加载的覆盖（通常是工作区覆盖全局）
              this.nameToPath.set(config.name, agentPath);
            }
          }
        }
      } catch (error) {
        console.warn(`加载 Agent 列表失败 ${agentsBasePath}:`, error);
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

      this.agents.set(agentPath, agent);
      this.nameToPath.set(name, agentPath);
      return agent;
    } catch (error) {
      console.warn(`创建 Agent 失败 ${name}:`, error);
      return null;
    }
  }

  /**
   * 获取 Agent 实例（通过名称或路径）
   */
  getAgent(nameOrPath: string): AgentInstance | null {
    // 如果是完整路径，直接查找
    if (this.agents.has(nameOrPath)) {
      return this.agents.get(nameOrPath)!;
    }

    // 否则当作名称查找
    const agentPath = this.nameToPath.get(nameOrPath);
    if (agentPath) {
      return this.agents.get(agentPath) || null;
    }

    return null;
  }

  /**
   * 获取 Agent 实例 (通过名称，保持向后兼容)
   */
  getAgentByName(name: string): AgentInstance | null {
    const agentPath = this.nameToPath.get(name);
    return agentPath ? this.agents.get(agentPath) || null : null;
  }

  /**
   * 获取所有 Agent 配置（包含路径信息）
   */
  async getAllAgents(): Promise<(AgentConfig & { agentPath?: string })[]> {
    const configs: (AgentConfig & { agentPath?: string })[] = [];
    for (const [agentPath, agent] of this.agents.entries()) {
      const config = agent.getConfig();
      configs.push({
        ...config,
        agentPath: agentPath
      });
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
      this.agents.delete(agentPath);
      // 更新 nameToPath 映射
      if (this.nameToPath.get(config.name) === agentPath) {
        this.nameToPath.delete(config.name);
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
   * 获取 Agent 数量
   */
  getAgentsCount(): number {
    return this.agents.size;
  }

  /**
   * 获取所有 Agent 的摘要信息（包含路径信息）
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig & { agentPath?: string };
    chatLogsCount: number;
    lastChatTime?: number;
    hasMCPConfig: boolean;
    tasksCount: number;
  }>> {
    const summaries: Array<{
      config: AgentConfig & { agentPath?: string };
      chatLogsCount: number;
      lastChatTime?: number;
      hasMCPConfig: boolean;
      tasksCount: number;
    }> = [];
    for (const [agentPath, agent] of this.agents.entries()) {
      const summary = await agent.getSummary();
      summaries.push({
        ...summary,
        config: {
          ...summary.config,
          agentPath: agentPath
        }
      });
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

    console.log(`已更新 Agent 映射关系: ${oldName} -> ${newName} (路径: ${agentPath})`);
  }

  /**
   * 获取所有配置的Agent基础路径
   */
  getAgentPaths(): string[] {
    return [...this.agentPaths];
  }
}