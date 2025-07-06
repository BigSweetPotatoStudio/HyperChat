import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { CONSTANTS } from "./constants.mjs";
import { AgentConfig, ChatHistoryItem } from "./types.mjs";
import { DataList } from "./dataList.mjs";

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
      key: path.basename(agentPath),
      name: path.basename(agentPath),
      prompt: '',
      allowMCPs: [],
      confirm_call_tool: false,
      created: Date.now(),
      lastModified: Date.now(),
    };

    this.chatLogs = new DataList<ChatHistoryItem>(path.join(agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS), DataList.FileFormat.YAML);
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

    if (fs.existsSync(this.configPath)) {
      try {
        const content = await fs.promises.readFile(this.configPath, "utf-8");
        const config = yaml.load(content) as AgentConfig;
        
        // 合并配置，但确保 name 字段不为空
        this.config = { ...this.config, ...config };
        
        // 如果从配置文件读取的 name 为空，使用默认的 key 作为 name
        if (!this.config.name || this.config.name.trim() === '') {
          this.config.name = this.config.key;
        }
      } catch (error) {
        console.warn(`加载 Agent 配置失败 ${this.config.key}:`, error);
      }
    }
  }


  /**
   * 保存 Agent 配置
   */
  async saveConfig(): Promise<boolean> {
    try {
      this.config.lastModified = Date.now();
      const yamlContent = yaml.dump(this.config, { indent: 2 });
      await fs.promises.writeFile(this.configPath, yamlContent, "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存 Agent 配置失败 ${this.config.key}:`, error);
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
    chatLog.agentKey = this.config.key;
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
      console.warn(`删除 Agent 失败 ${this.config.key}:`, error);
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
  private agentsPath: string;
  private agents: Map<string, AgentInstance> = new Map(); // key -> AgentInstance
  private nameToKey: Map<string, string> = new Map(); // name -> key

  constructor(agentsPath: string) {
    this.agentsPath = agentsPath;
  }

  /**
   * 初始化 Agent 管理器
   */
  async init(): Promise<void> {
    if (!fs.existsSync(this.agentsPath)) {
      await fs.promises.mkdir(this.agentsPath, { recursive: true });
    }
    await this.loadAllAgents();
  }

  /**
   * 加载所有 Agent
   */
  private async loadAllAgents(): Promise<void> {
    if (!fs.existsSync(this.agentsPath)) {
      return;
    }

    try {
      const entries = await fs.promises.readdir(this.agentsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const agentPath = path.join(this.agentsPath, entry.name);
          const agent = new AgentInstance(agentPath);

          if (agent.exists()) {
            await agent.init();
            const config = agent.getConfig();


            this.agents.set(config.key, agent);
            this.nameToKey.set(config.name, config.key);
          }
        }
      }
    } catch (error) {
      console.warn('加载 Agent 列表失败:', error);
    }
  }


  /**
   * 创建安全的文件夹名称
   */
  private createSafeFolderName(name: string): string {
    // 移除或替换不安全的字符
    return name
      .replace(/[\\/:*?"<>|]/g, '_') // 替换Windows不允许的字符
      .replace(/[\s\t\n\r]/g, '_') // 替换空白字符
      .replace(/\.+$/g, '') // 移除结尾的点
      .replace(/^\s*$/, 'Unnamed') // 如果名称为空，使用默认名称
      .substring(0, 100); // 限制长度
  }

  /**
   * 生成唯一的文件夹名称
   */
  private async generateUniqueFolderName(baseName: string): Promise<string> {
    let folderName = this.createSafeFolderName(baseName);
    let counter = 1;

    while (fs.existsSync(path.join(this.agentsPath, folderName))) {
      folderName = `${this.createSafeFolderName(baseName)}_${counter}`;
      counter++;
    }

    return folderName;
  }

  /**
   * 创建新的 Agent
   */
  async createAgent(config: Partial<AgentConfig>): Promise<AgentInstance | null> {
    const key = config.key || `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
    const name = config.name || key;

    if (this.agents.has(key)) {
      console.warn(`Agent ${key} 已存在`);
      return null;
    }

    // 使用 name 作为文件夹名称
    const folderName = await this.generateUniqueFolderName(name);
    const agentPath = path.join(this.agentsPath, folderName);

    const agentConfig: AgentConfig = {
      key,
      name,
      prompt: config.prompt || '',
      allowMCPs: config.allowMCPs || [],
      confirm_call_tool: config.confirm_call_tool ?? false,
      created: Date.now(),
      lastModified: Date.now(),
      ...config,
    };

    try {
      const agent = new AgentInstance(agentPath, agentConfig);
      await agent.init();
      await agent.saveConfig();

      this.agents.set(key, agent);
      this.nameToKey.set(name, key);
      return agent;
    } catch (error) {
      console.warn(`创建 Agent 失败 ${key}:`, error);
      return null;
    }
  }

  /**
   * 获取 Agent 实例 (通过 key)
   */
  getAgent(key: string): AgentInstance | null {
    return this.agents.get(key) || null;
  }

  /**
   * 获取 Agent 实例 (通过 name)
   */
  getAgentByName(name: string): AgentInstance | null {
    const key = this.nameToKey.get(name);
    return key ? this.agents.get(key) || null : null;
  }

  /**
   * 获取所有 Agent 配置
   */
  async getAllAgents(): Promise<AgentConfig[]> {
    const configs: AgentConfig[] = [];
    for (const agent of this.agents.values()) {
      configs.push(agent.getConfig());
    }
    return configs;
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(key: string): Promise<boolean> {
    const agent = this.agents.get(key);
    if (!agent) {
      return false;
    }

    const config = agent.getConfig();
    const success = await agent.delete();
    if (success) {
      this.agents.delete(key);
      this.nameToKey.delete(config.name);
    }
    return success;
  }

  /**
   * 通过 name 删除 Agent
   */
  async deleteAgentByName(name: string): Promise<boolean> {
    const key = this.nameToKey.get(name);
    if (!key) {
      return false;
    }
    return await this.deleteAgent(key);
  }

  /**
   * 获取 Agent 数量
   */
  getAgentsCount(): number {
    return this.agents.size;
  }

  /**
   * 获取所有 Agent 的摘要信息
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    const summaries: Array<{
      config: AgentConfig;
      chatLogsCount: number;
      lastChatTime?: number;
    }> = [];
    for (const agent of this.agents.values()) {
      summaries.push(await agent.getSummary());
    }
    return summaries;
  }
}