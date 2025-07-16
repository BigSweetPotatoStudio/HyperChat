import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { CONSTANTS } from "./constants.mjs";

import { DataList } from "./dataList.mjs";
import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared";

/**
 * Agent 类 - 管理单个 Agent 的配置和聊天记录
 */
export class AgentInstance {
  private config: AgentConfig;
  private chatLogs: DataList<ChatHistoryItem>;
  private agentPath: string;
  private configPath: string;

  constructor(agentPath: string, config?: AgentConfig) {
    this.agentPath = agentPath;
    this.configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);

    this.config = config || {
      name: path.basename(agentPath),
      prompt: '',
      allowMCPs: [],
      isConfirmCallTool: false,
      maxTokens: 4000,
      tags: [],
      subAgents: [],
      version: 1,
    };

    this.chatLogs = new DataList<ChatHistoryItem>(path.join(agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS), DataList.FileFormat.YAML,
      // (item) => `${dayjs().format("YYMMDD-HHmmss")}-${sanitizeFileName(item.label, 50, v4().slice(0, 8))}`
    );
  }

  /**
   * 初始化 Agent
   */
  async init(): Promise<void> {
    // 创建目录结构
    await this.createDirectories();

    // 加载配置
    await this.loadConfig();

    // 加载聊天记录
    await this.chatLogs.load();
  }

  /**
   * 创建目录结构
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      this.agentPath,
      path.join(this.agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * 加载 Agent 配置
   */
  private async loadConfig(): Promise<void> {
    // 确保 key 始终与文件夹名称保持一致
    const folderName = path.basename(this.agentPath);
    this.config.name = folderName;

    if (fs.existsSync(this.configPath)) {
      try {
        const content = await fs.promises.readFile(this.configPath, "utf-8");
        const config = yaml.load(content) as AgentConfig;

        // 合并配置
        this.config = { ...this.config, ...config };

        // 如果从配置文件读取的 name 为空，使用文件夹名称作为 name
        if (!this.config.name || this.config.name.trim() === '') {
          this.config.name = folderName;
        } else {
          // 清理名称中的scope前缀，确保名称与文件夹名称一致
          const cleanName = this.config.name.replace(/^(global|workspace):/, '');
          this.config.name = cleanName || folderName;
        }
      } catch (error) {
        console.warn(`加载 Agent 配置失败 ${folderName}:`, error);
      }
    }
  }


  /**
   * 保存 Agent 配置
   */
  async saveConfig(): Promise<boolean> {
    try {
      const yamlContent = yaml.dump(this.config, { indent: 2 });
      await fs.promises.writeFile(this.configPath, yamlContent, "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存 Agent 配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 获取 Agent 配置
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * 更新 Agent 配置
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<boolean> {
    this.config = { ...this.config, ...updates };
    return await this.saveConfig();
  }

  /**
   * 获取所有聊天记录
   */
  async getChatLogs(): Promise<ChatHistoryItem[]> {
    return await this.chatLogs.getAll();
  }

  /**
   * 获取单个聊天记录
   */
  async getChatLog(key: string): Promise<ChatHistoryItem | null> {
    return await this.chatLogs.get(key);
  }

  /**
   * 添加或更新聊天记录
   */
  async setChatLog(chatLog: ChatHistoryItem): Promise<boolean> {
    // 确保聊天记录与当前 Agent 关联
    chatLog.agentName = this.config.name;
    return await this.chatLogs.set(chatLog);
  }

  /**
   * 删除聊天记录
   */
  async deleteChatLog(key: string): Promise<boolean> {
    return await this.chatLogs.delete(key);
  }

  /**
   * 清空所有聊天记录
   */
  async clearChatLogs(): Promise<boolean> {
    return await this.chatLogs.clear();
  }

  /**
   * 获取聊天记录数量
   */
  async getChatLogsCount(): Promise<number> {
    return await this.chatLogs.size();
  }

  /**
   * 检查 Agent 是否存在
   */
  exists(): boolean {
    return fs.existsSync(this.agentPath) && fs.existsSync(this.configPath);
  }

  /**
   * 删除整个 Agent
   */
  async delete(): Promise<boolean> {
    try {
      if (fs.existsSync(this.agentPath)) {
        await fs.promises.rm(this.agentPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.warn(`删除 Agent 失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 获取 Agent 摘要信息
   */
  async getSummary(): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }> {
    const chatLogs = await this.getChatLogs();
    const lastChatTime = chatLogs.length > 0
      ? Math.max(...chatLogs.map(log => log.dateTime))
      : undefined;

    return {
      config: this.config,
      chatLogsCount: chatLogs.length,
      lastChatTime,
    };
  }
}

/**
 * Agent 管理器类 - 管理所有 Agent 实例
 */
export class AgentManager {
  private localPath: string;
  private globalPath: string;
  private agents: Map<string, AgentInstance> = new Map(); // key -> AgentInstance
  private nameToKey: Map<string, string> = new Map(); // name -> key

  constructor(localPath: string, globalPath?: string) {
    this.localPath = localPath;
    this.globalPath = globalPath || localPath;
  }

  /**
   * 初始化 Agent 管理器（不自动创建目录，采用懒加载模式）
   */
  async init(): Promise<void> {
    // 不自动创建 agents 目录，采用懒加载模式：只有需要时才创建
    // if (!fs.existsSync(this.localPath)) {
    //   await fs.promises.mkdir(this.localPath, { recursive: true });
    // }
    await this.loadAllAgents();
  }

  /**
   * 加载所有 Agent（支持全局+工作区配置合并）
   */
  private async loadAllAgents(): Promise<void> {
    // 先加载全局 Agents，再加载本地 Agents（本地覆盖全局）
    // 如果本地路径和全局路径相同，则只加载一次
    const paths = this.localPath === this.globalPath ? [this.localPath] : [this.globalPath, this.localPath];
    
    for (let i = 0; i < paths.length; i++) {
      const agentsPath = paths[i];
      const scope = (this.localPath !== this.globalPath && agentsPath === this.globalPath) ? "global" : "workspace";
      
      if (!fs.existsSync(agentsPath)) {
        continue;
      }

      try {
        const entries = await fs.promises.readdir(agentsPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const agentPath = path.join(agentsPath, entry.name);
            const agent = new AgentInstance(agentPath);

            if (agent.exists()) {
              await agent.init();
              const config = agent.getConfig();
              
              // 使用 scope:name 作为唯一标识，支持同名 Agent 的全局/工作区区分
              const agentId = this.getAgentId(config.name, scope);
              this.agents.set(agentId, agent);
              this.nameToKey.set(config.name, agentId);
            }
          }
        }
      } catch (error) {
        console.warn(`加载 Agent 列表失败 ${agentsPath}:`, error);
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
   * 生成唯一的文件夹名称（工作区专用，保持向后兼容）
   */
  private async generateUniqueFolderName(baseName: string): Promise<string> {
    return this.generateUniqueAgentFolderName(baseName, "workspace");
  }

  /**
   * 生成唯一的Agent文件夹名称（支持指定scope）
   */
  private async generateUniqueAgentFolderName(baseName: string, scope: "global" | "workspace"): Promise<string> {
    const targetPath = scope === "global" ? this.globalPath : this.localPath;
    let folderName = this.createSafeFolderName(baseName);
    let counter = 1;

    while (fs.existsSync(path.join(targetPath, folderName))) {
      folderName = `${this.createSafeFolderName(baseName)}_${counter}`;
      counter++;
    }

    return folderName;
  }

  /**
   * 获取 Agent ID（基于 scope 和 name）
   */
  private getAgentId(name: string, scope?: "global" | "workspace"): string {
    const actualScope = scope || "workspace";
    return `${actualScope}:${name}`;
  }

  /**
   * 检测 Agent 的实际 scope
   */
  getAgentScope(name: string): "global" | "workspace" | null {
    const workspaceAgentId = this.getAgentId(name, "workspace");
    const globalAgentId = this.getAgentId(name, "global");
    
    if (this.agents.has(workspaceAgentId)) {
      return "workspace";
    } else if (this.agents.has(globalAgentId)) {
      return "global";
    } else {
      return null;
    }
  }

  /**
   * 创建新的 Agent（支持在工作区或全局创建）
   */
  async createAgent(config: Partial<AgentConfig>, scope?: "global" | "workspace"): Promise<AgentInstance | null> {
    const actualScope = scope || "workspace";
    
    // 确定目标路径：全局或工作区
    const targetPath = actualScope === "global" ? this.globalPath : this.localPath;
    
    // 确保目标 agents 目录存在（懒加载模式）
    if (!fs.existsSync(targetPath)) {
      await fs.promises.mkdir(targetPath, { recursive: true });
    }

    const name = config.name || `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;

    // 使用 name 作为文件夹名称，在对应的scope中生成唯一名称
    const folderName = await this.generateUniqueAgentFolderName(name, actualScope);
    const agentPath = path.join(targetPath, folderName);

    const agentId = this.getAgentId(name, actualScope);

    if (this.agents.has(agentId)) {
      console.warn(`Agent ${agentId} 已存在`);
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

      this.agents.set(agentId, agent);
      this.nameToKey.set(name, agentId);
      return agent;
    } catch (error) {
      console.warn(`创建 Agent 失败 ${agentId}:`, error);
      return null;
    }
  }

  /**
   * 获取 Agent 实例 (通过 key，智能查找)
   * 优先查找工作区 Agent，如果没有找到再查找全局 Agent
   */
  getAgent(key: string, scope?: "global" | "workspace"): AgentInstance | null {
    // 如果 key 已经包含 scope，直接使用
    if (key.includes(':')) {
      return this.agents.get(key) || null;
    }
    
    // 如果指定了 scope，使用指定的 scope
    if (scope) {
      const agentId = this.getAgentId(key, scope);
      return this.agents.get(agentId) || null;
    }
    
    // 智能查找：优先查找工作区 Agent，如果没有找到再查找全局 Agent
    const workspaceAgentId = this.getAgentId(key, "workspace");
    const workspaceAgent = this.agents.get(workspaceAgentId);
    if (workspaceAgent) {
      return workspaceAgent;
    }
    
    const globalAgentId = this.getAgentId(key, "global");
    return this.agents.get(globalAgentId) || null;
  }

  /**
   * 获取 Agent 实例 (通过 name)
   */
  getAgentByName(name: string): AgentInstance | null {
    const key = this.nameToKey.get(name);
    return key ? this.agents.get(key) || null : null;
  }

  /**
   * 获取所有 Agent 配置（包含 scope 信息）
   */
  async getAllAgents(): Promise<(AgentConfig & { scope?: "global" | "workspace" })[]> {
    const configs: (AgentConfig & { scope?: "global" | "workspace" })[] = [];
    for (const [agentId, agent] of this.agents.entries()) {
      const config = agent.getConfig();
      const scope = agentId.startsWith('global:') ? 'global' : 'workspace';
      configs.push({
        ...config,
        scope: scope
      });
    }
    return configs;
  }

  /**
   * 删除 Agent（支持删除全局和工作区 Agent）
   */
  async deleteAgent(key: string, scope?: "global" | "workspace"): Promise<boolean> {
    const agentId = key.includes(':') ? key : this.getAgentId(key, scope);
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    const config = agent.getConfig();
    const success = await agent.delete();
    if (success) {
      this.agents.delete(agentId);
      // 更新 nameToKey 映射
      if (this.nameToKey.get(config.name) === agentId) {
        this.nameToKey.delete(config.name);
      }
    }
    return success;
  }

  /**
   * 通过 name 删除 Agent（智能查找，支持删除全局 Agent）
   */
  async deleteAgentByName(name: string): Promise<boolean> {
    // 智能查找：优先删除工作区 Agent，如果没有再删除全局 Agent
    const workspaceAgentId = this.getAgentId(name, "workspace");
    if (this.agents.has(workspaceAgentId)) {
      return await this.deleteAgent(workspaceAgentId);
    }
    
    // 如果工作区没有，删除全局 Agent
    const globalAgentId = this.getAgentId(name, "global");
    if (this.agents.has(globalAgentId)) {
      return await this.deleteAgent(globalAgentId);
    }
    
    return false;
  }

  /**
   * 获取 Agent 数量
   */
  getAgentsCount(): number {
    return this.agents.size;
  }

  /**
   * 获取所有 Agent 的摘要信息（包含 scope 信息）
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig & { scope?: "global" | "workspace" };
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    const summaries: Array<{
      config: AgentConfig & { scope?: "global" | "workspace" };
      chatLogsCount: number;
      lastChatTime?: number;
    }> = [];
    for (const [agentId, agent] of this.agents.entries()) {
      const summary = await agent.getSummary();
      const scope = agentId.startsWith('global:') ? 'global' : 'workspace';
      summaries.push({
        ...summary,
        config: {
          ...summary.config,
          scope: scope
        }
      });
    }
    return summaries;
  }
}