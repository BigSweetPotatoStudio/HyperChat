import { v4 } from "uuid";
import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import * as os from "os";

// 常量定义
const CONSTANTS = {
  HYPERCHAT_DIR: '.hyperchat',
  CONFIG_FILES: {
    WORKSPACE: 'workspace.json',
    MCP: 'mcp.json',
    AGENT_CONFIG: 'config.json',
  },
  DIRECTORIES: {
    AGENTS: 'agents',
    CHAT_LOGS: 'chatlogs',
    KNOWLEDGE: 'knowledge',
    TEMP: 'temp',
  },
  FILE_PATTERNS: {
    JSON: '.json',
    HIDDEN_PREFIX: '.',
  },
  GLOBAL_PATH: path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat'),
} as const;

// 重新实现需要的类型定义
export type AgentConfig = {
  type?: "builtin" | "custom";
  key: string;
  name: string;
  prompt: string;
  description?: string;
  callable?: boolean;
  allowMCPs: string[];
  modelKey?: string;
  attachedDialogueCount?: number;
  temperature?: number;
  confirm_call_tool: boolean;
  fallbackModelKey?: string;
  tags?: string[];
  subAgents?: string[];
  version?: number;
  created: number;
  lastModified: number;
};

// 兼容旧的 Agent 类型
export type Agent = AgentConfig;

export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<any>;
  modelKey: string;
  agentKey: string;
  sented: boolean;
  icon?: string;
  requestType: "stream";
  dateTime: number;
  isCalled: boolean;
  isTask: boolean;
  taskKey?: string;
  allowMCPs: string[];
  attachedDialogueCount?: number;
  temperature?: number;
  deleted?: boolean;
  confirm_call_tool: boolean;
  lastMessage?: any;
  version?: number | string;
};

export type MCPServerConfig = {
  command?: string;
  args?: string[];
  env?: { [s: string]: string };
  headers?: { [s: string]: string };
  url?: string;
  type?: "stdio" | "sse" | "streamableHttp";
  hyperchat?: {
    config: { [s in string]: any };
  };
  disabled?: boolean;
};

export type IMCPClient = {
  tools: Array<any>;
  prompts: Array<any>;
  resources: Array<any>;
  name: string;
  status: "disconnected" | "connected" | "connecting" | "disabled" | "deleted";
  order: number;
  config: MCPServerConfig;
  ext: {
    configSchema?: { [s in string]: any };
  };
  source: "hyperchat" | "builtin";
  version: string;
  servername: string;
};

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

    this.chatLogs = new DataList<ChatHistoryItem>(path.join(agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS));
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
        const config = JSON.parse(content) as AgentConfig;
        this.config = { ...this.config, ...config };
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
      await fs.promises.writeFile(this.configPath, JSON.stringify(this.config, null, 2), "utf-8");
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
  private agents: Map<string, AgentInstance> = new Map();

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
            this.agents.set(entry.name, agent);
          }
        }
      }
    } catch (error) {
      console.warn('加载 Agent 列表失败:', error);
    }
  }

  /**
   * 创建新的 Agent
   */
  async createAgent(config: Partial<AgentConfig>): Promise<AgentInstance | null> {
    const key = config.key || `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
    const agentPath = path.join(this.agentsPath, key);

    if (this.agents.has(key)) {
      console.warn(`Agent ${key} 已存在`);
      return null;
    }

    const agentConfig: AgentConfig = {
      key,
      name: config.name || key,
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
      return agent;
    } catch (error) {
      console.warn(`创建 Agent 失败 ${key}:`, error);
      return null;
    }
  }

  /**
   * 获取 Agent 实例
   */
  getAgent(key: string): AgentInstance | null {
    return this.agents.get(key) || null;
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

    const success = await agent.delete();
    if (success) {
      this.agents.delete(key);
    }
    return success;
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

/**
 * 文件夹数据列表管理类
 * 专门处理一个文件夹中全部是同一种类型文件的情况
 */
export class DataList<T extends { key: string }> {
  private items: Map<string, T> = new Map();
  private loaded = false;
  private lastModified = 0;
  private loadPromise?: Promise<void>;

  constructor(
    private dirPath: string,
    private getItemKey: (item: T) => string = (item) => item.key,
    private generateKey: () => string = () => `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`
  ) { }

  /**
   * 获取文件名（基于 key）
   */
  private getFileName(key: string): string {
    return `${key}.json`;
  }

  /**
   * 加载所有文件
   */
  async load(): Promise<void> {
    // 避免并发加载
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._doLoad();
    await this.loadPromise;
    this.loadPromise = undefined;
  }

  /**
   * 实际执行加载的方法
   */
  private async _doLoad(): Promise<void> {
    this.items.clear();

    if (!fs.existsSync(this.dirPath)) {
      this.loaded = true;
      this.lastModified = Date.now();
      return;
    }

    try {
      const dirStat = await fs.promises.stat(this.dirPath);
      const currentModified = dirStat.mtime.getTime();

      // 如果目录没有修改且已加载，跳过
      if (this.loaded && currentModified <= this.lastModified) {
        return;
      }

      const files = await fs.promises.readdir(this.dirPath);
      const loadPromises = files
        .filter(file => file.endsWith('.json') && !file.startsWith('.'))
        .map(async (file) => {
          const filePath = path.join(this.dirPath, file);
          try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const item = JSON.parse(content) as T;

            // 确保 item 有必要的字段
            if (item && typeof item === 'object' && 'key' in item && item.key && typeof item.key === 'string') {
              return { key: this.getItemKey(item), item };
            } else {
              console.warn(`文件 ${file} 数据格式无效，缺少必要的 key 字段`);
            }
          } catch (error) {
            console.warn(`加载文件 ${file} 失败:`, error);
          }
          return null;
        });

      const results = await Promise.all(loadPromises);
      results.forEach(result => {
        if (result) {
          this.items.set(result.key, result.item);
        }
      });

      this.lastModified = currentModified;
    } catch (error) {
      console.warn(`读取目录 ${this.dirPath} 失败:`, error);
    }

    this.loaded = true;
  }

  /**
   * 确保已加载数据
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.load();
      return;
    }

    // 检查目录是否有更新
    if (fs.existsSync(this.dirPath)) {
      try {
        const dirStat = await fs.promises.stat(this.dirPath);
        if (dirStat.mtime.getTime() > this.lastModified) {
          await this.load();
        }
      } catch (error) {
        // 如果无法获取状态，重新加载
        await this.load();
      }
    }
  }

  /**
   * 获取所有项目
   */
  async getAll(): Promise<T[]> {
    await this.ensureLoaded();
    return Array.from(this.items.values());
  }

  /**
   * 获取单个项目
   */
  async get(key: string): Promise<T | null> {
    await this.ensureLoaded();
    return this.items.get(key) || null;
  }

  /**
   * 添加或更新单个项目
   */
  async set(item: T): Promise<boolean> {
    try {
      // 确保目录存在
      if (!fs.existsSync(this.dirPath)) {
        await fs.promises.mkdir(this.dirPath, { recursive: true });
      }

      // 如果没有 key，生成新的 key
      if (!item.key) {
        (item as any).key = this.generateKey();
      }

      const key = this.getItemKey(item);
      const filename = this.getFileName(key);
      const filePath = path.join(this.dirPath, filename);

      await fs.promises.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");

      // 更新内存中的数据
      await this.ensureLoaded();
      this.items.set(key, item);

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`保存文件 ${this.getFileName(this.getItemKey(item))} 失败:`, errorMsg);
      return false;
    }
  }

  /**
   * 删除单个项目
   */
  async delete(key: string): Promise<boolean> {
    const filename = this.getFileName(key);
    const filePath = path.join(this.dirPath, filename);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      // 从内存中删除
      await this.ensureLoaded();
      this.items.delete(key);

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`删除文件 ${filename} 失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 保存整个列表（批量保存）
   */
  async saveAll(items: T[]): Promise<boolean> {
    // 确保目录存在
    if (!fs.existsSync(this.dirPath)) {
      await fs.promises.mkdir(this.dirPath, { recursive: true });
    }

    // 获取现有文件
    const existingFiles = new Set<string>();
    try {
      if (fs.existsSync(this.dirPath)) {
        const files = await fs.promises.readdir(this.dirPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('.')) {
            existingFiles.add(file);
          }
        }
      }
    } catch (error) {
      console.warn(`读取目录失败:`, error);
    }

    // 为没有 key 的项目生成 key
    const itemsWithKeys = items.map(item => {
      if (!item.key) {
        (item as any).key = this.generateKey();
      }
      return item;
    });

    // 并行保存所有文件
    const currentFiles = new Set<string>();
    const savePromises = itemsWithKeys.map(async (item) => {
      const key = this.getItemKey(item);
      const filename = this.getFileName(key);
      currentFiles.add(filename);

      const filePath = path.join(this.dirPath, filename);
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
        return { success: true, filename };
      } catch (error) {
        console.warn(`保存文件 ${filename} 失败:`, error);
        return { success: false, filename, error };
      }
    });

    const saveResults = await Promise.all(savePromises);
    const success = saveResults.every(result => result.success);

    // 并行删除不再存在的文件
    const deletePromises = Array.from(existingFiles)
      .filter(file => !currentFiles.has(file))
      .map(async (existingFile) => {
        const filePath = path.join(this.dirPath, existingFile);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn(`删除旧文件 ${existingFile} 失败:`, error);
        }
      });

    await Promise.all(deletePromises);

    // 重新加载数据到内存
    await this.load();

    return success;
  }

  /**
   * 检查项目是否存在
   */
  async has(key: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.items.has(key);
  }

  /**
   * 获取项目数量
   */
  async size(): Promise<number> {
    await this.ensureLoaded();
    return this.items.size;
  }

  /**
   * 清空所有项目
   */
  async clear(): Promise<boolean> {
    try {
      if (fs.existsSync(this.dirPath)) {
        const files = await fs.promises.readdir(this.dirPath);
        const deletePromises = files
          .filter(file => file.endsWith('.json') && !file.startsWith('.'))
          .map(file => fs.promises.unlink(path.join(this.dirPath, file)));

        await Promise.all(deletePromises);
      }

      this.items.clear();
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`清空目录失败: ${errorMsg}`);
      return false;
    }
  }
}

// 工作区配置类型定义
export type WorkspaceConfig = {
  key: string;
  name: string;
  path: string;
  description?: string;
  created: number;
  lastAccessed: number;
  settings: WorkspaceSettings;
};

// 工作区设置
export type WorkspaceSettings = {
  enableMCP: boolean;
  enableAgents: boolean;
  enableKnowledgeBase: boolean;
  defaultModel?: string;
  defaultAgent?: string;
  autoSave: boolean;
  syncToCloud: boolean;
};

/**
 * 验证工作区配置
 */
function validateWorkspaceConfig(config: any): config is WorkspaceConfig {
  return (
    config &&
    typeof config === 'object' &&
    typeof config.key === 'string' &&
    typeof config.name === 'string' &&
    typeof config.path === 'string' &&
    typeof config.created === 'number' &&
    typeof config.lastAccessed === 'number' &&
    config.settings &&
    typeof config.settings === 'object'
  );
}

/**
 * 验证工作区设置
 */
function validateWorkspaceSettings(settings: any): settings is WorkspaceSettings {
  return (
    settings &&
    typeof settings === 'object' &&
    typeof settings.enableMCP === 'boolean' &&
    typeof settings.enableAgents === 'boolean' &&
    typeof settings.enableKnowledgeBase === 'boolean' &&
    typeof settings.autoSave === 'boolean' &&
    typeof settings.syncToCloud === 'boolean'
  );
}

// 工作区文件树节点
export type WorkspaceFileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: number;
  children?: WorkspaceFileNode[];
  extension?: string;
  isHidden?: boolean;
};

/**
 * 工作区类 - 封装单个工作区的所有操作
 */
export class Workspace {
  private config: WorkspaceConfig;
  private agentManager: AgentManager;
  private mcpConfig: Record<string, MCPServerConfig> = {};
  private mcpClients: Record<string, IMCPClient> = {};
  private fileTree?: WorkspaceFileNode;
  private lastSync?: number;
  private readonly HYPERCHAT_DIR = CONSTANTS.HYPERCHAT_DIR;

  constructor(workspacePath: string, config?: WorkspaceConfig) {
    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

    this.config = config || {
      key: `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`,
      name: path.basename(workspacePath),
      path: workspacePath,
      created: Date.now(),
      lastAccessed: Date.now(),
      settings: {
        enableMCP: true,
        enableAgents: true,
        enableKnowledgeBase: true,
        autoSave: true,
        syncToCloud: false,
      },
    };

    this.agentManager = new AgentManager(path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS));
  }

  /**
   * 获取工作区配置
   */
  getConfig(): WorkspaceConfig {
    return this.config;
  }

  /**
   * 获取工作区路径
   */
  getPath(): string {
    return this.config.path;
  }

  /**
   * 获取 .hyperchat 目录路径
   */
  getHyperChatPath(): string {
    return path.join(this.config.path, this.HYPERCHAT_DIR);
  }

  /**
   * 初始化工作区
   */
  async init(): Promise<void> {
    // 创建目录结构
    await this.createDirectories();

    // 加载数据
    await this.load();

    // 保存配置
    await this.saveConfig();
  }

  /**
   * 创建工作区目录结构
   */
  private async createDirectories(): Promise<void> {
    const hyperChatPath = this.getHyperChatPath();
    const directories = [
      hyperChatPath,
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS),
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.KNOWLEDGE),
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.TEMP),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }

    // 创建默认配置文件
    const defaultFiles = [
      { name: CONSTANTS.CONFIG_FILES.MCP, content: JSON.stringify({ mcpServers: {} }, null, 2) },
    ];

    for (const file of defaultFiles) {
      const filePath = path.join(hyperChatPath, file.name);
      if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, file.content, "utf-8");
      }
    }
  }

  /**
   * 加载工作区数据
   */
  async load(): Promise<void> {
    const hyperChatPath = this.getHyperChatPath();

    // 加载配置文件
    await this.loadConfig();

    // 加载 agents
    await this.agentManager.init();

    // 加载 MCP 配置
    await this.loadMcpConfig();

    this.config.lastAccessed = Date.now();
  }

  /**
   * 加载工作区配置
   */
  private async loadConfig(): Promise<void> {
    const configPath = path.join(this.getHyperChatPath(), CONSTANTS.CONFIG_FILES.WORKSPACE);

    if (fs.existsSync(configPath)) {
      try {
        const content = await fs.promises.readFile(configPath, "utf-8");
        const config = JSON.parse(content);

        if (validateWorkspaceConfig(config)) {
          this.config = { ...this.config, ...config };
        } else {
          console.warn('工作区配置格式无效，使用默认配置');
        }
      } catch (error) {
        console.warn(`加载工作区配置失败:`, error);
      }
    }
  }

  /**
   * 加载 MCP 配置
   */
  private async loadMcpConfig(): Promise<void> {
    const mcpPath = path.join(this.getHyperChatPath(), CONSTANTS.CONFIG_FILES.MCP);

    if (fs.existsSync(mcpPath)) {
      try {
        const content = await fs.promises.readFile(mcpPath, "utf-8");
        const data = JSON.parse(content);
        this.mcpConfig = data.mcpServers || {};
      } catch (error) {
        console.warn(`加载 MCP 配置失败:`, error);
      }
    }
  }

  /**
   * 保存工作区配置
   */
  async saveConfig(): Promise<void> {
    const configPath = path.join(this.getHyperChatPath(), CONSTANTS.CONFIG_FILES.WORKSPACE);

    try {
      await fs.promises.writeFile(configPath, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (error) {
      console.warn(`保存工作区配置失败:`, error);
    }
  }

  /**
   * 保存 MCP 配置
   */
  async saveMcpConfig(): Promise<void> {
    const mcpPath = path.join(this.getHyperChatPath(), CONSTANTS.CONFIG_FILES.MCP);

    try {
      await fs.promises.writeFile(mcpPath, JSON.stringify({ mcpServers: this.mcpConfig }, null, 2), "utf-8");
    } catch (error) {
      console.warn(`保存 MCP 配置失败:`, error);
    }
  }

  /**
   * 保存所有数据
   */
  async save(): Promise<void> {
    await this.saveConfig();
    await this.saveMcpConfig();
    this.lastSync = Date.now();
  }

  // ========== Agent 管理 ==========

  /**
   * 获取所有 agents
   */
  async getAgents(): Promise<AgentConfig[]> {
    return await this.agentManager.getAllAgents();
  }

  /**
   * 获取单个 agent 实例
   */
  getAgentInstance(key: string): AgentInstance | null {
    return this.agentManager.getAgent(key);
  }

  /**
   * 获取单个 agent 配置
   */
  async getAgent(key: string): Promise<AgentConfig | null> {
    const instance = this.agentManager.getAgent(key);
    return instance ? instance.getConfig() : null;
  }

  /**
   * 创建或更新 agent
   */
  async setAgent(agent: Partial<AgentConfig>): Promise<boolean> {
    if (agent.key) {
      // 更新现有 agent
      const instance = this.agentManager.getAgent(agent.key);
      if (instance) {
        return await instance.updateConfig(agent);
      }
    }

    // 创建新 agent
    const newAgent = await this.agentManager.createAgent(agent);
    return newAgent !== null;
  }

  /**
   * 删除 agent
   */
  async deleteAgent(key: string): Promise<boolean> {
    return await this.agentManager.deleteAgent(key);
  }

  /**
   * 获取所有 agents 数量
   */
  async getAgentsCount(): Promise<number> {
    return this.agentManager.getAgentsCount();
  }

  /**
   * 获取 Agent 的聊天记录
   */
  async getAgentChatLogs(agentKey: string): Promise<ChatHistoryItem[]> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getChatLogs() : [];
  }

  /**
   * 添加 Agent 聊天记录
   */
  async addAgentChatLog(agentKey: string, chatLog: ChatHistoryItem): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.setChatLog(chatLog) : false;
  }

  /**
   * 删除 Agent 聊天记录
   */
  async deleteAgentChatLog(agentKey: string, chatKey: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.deleteChatLog(chatKey) : false;
  }


  // ========== MCP 管理 ==========

  /**
   * 获取 MCP 配置
   */
  getMcpConfig(): Record<string, MCPServerConfig> {
    return this.mcpConfig;
  }

  /**
   * 设置 MCP 配置
   */
  async setMcpConfig(config: Record<string, MCPServerConfig>): Promise<void> {
    this.mcpConfig = config;
    await this.saveMcpConfig();
  }

  /**
   * 添加或更新单个 MCP 服务器配置
   */
  async setMcpServer(name: string, config: MCPServerConfig): Promise<void> {
    this.mcpConfig[name] = config;
    await this.saveMcpConfig();
  }

  /**
   * 删除 MCP 服务器配置
   */
  async deleteMcpServer(name: string): Promise<void> {
    delete this.mcpConfig[name];
    await this.saveMcpConfig();
  }

  // ========== 文件树管理 ==========

  /**
   * 扫描并更新文件树
   */
  async updateFileTree(options: {
    includeHidden?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  } = {}): Promise<boolean> {
    try {
      this.fileTree = await this.scanFiles(this.config.path, options);
      return true;
    } catch (error) {
      console.error('更新文件树失败:', error);
      return false;
    }
  }

  /**
   * 获取文件树
   */
  getFileTree(): WorkspaceFileNode | undefined {
    return this.fileTree;
  }

  /**
   * 扫描文件
   */
  private async scanFiles(workspacePath: string, options: {
    includeHidden?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  } = {}): Promise<WorkspaceFileNode> {
    const { includeHidden = false, maxDepth = 10, excludePatterns = [] } = options;

    const scanDirectory = async (dirPath: string, depth: number = 0): Promise<WorkspaceFileNode> => {
      const stats = await fs.promises.stat(dirPath);
      const name = path.basename(dirPath);

      const node: WorkspaceFileNode = {
        name,
        path: dirPath,
        type: "directory",
        modified: stats.mtime.getTime(),
        children: [],
      };

      if (depth >= maxDepth) {
        return node;
      }

      try {
        const entries = await fs.promises.readdir(dirPath);

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          const entryStats = await fs.promises.stat(fullPath);

          // 跳过隐藏文件
          if (!includeHidden && entry.startsWith('.')) {
            continue;
          }

          // 跳过排除模式
          if (excludePatterns.some(pattern => entry.includes(pattern))) {
            continue;
          }

          if (entryStats.isDirectory()) {
            const childNode = await scanDirectory(fullPath, depth + 1);
            node.children!.push(childNode);
          } else {
            const fileNode: WorkspaceFileNode = {
              name: entry,
              path: fullPath,
              type: "file",
              size: entryStats.size,
              modified: entryStats.mtime.getTime(),
              extension: path.extname(entry).toLowerCase(),
            };
            node.children!.push(fileNode);
          }
        }
      } catch (error) {
        console.warn(`无法读取目录 ${dirPath}:`, error);
      }

      return node;
    };

    return await scanDirectory(workspacePath);
  }

  // ========== 工具方法 ==========

  /**
   * 删除整个工作区
   */
  async delete(): Promise<boolean> {
    try {
      const hyperChatPath = this.getHyperChatPath();
      if (fs.existsSync(hyperChatPath)) {
        await fs.promises.rm(hyperChatPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.warn(`删除工作区失败:`, error);
      return false;
    }
  }

  /**
   * 检查工作区是否存在
   */
  exists(): boolean {
    return fs.existsSync(this.getHyperChatPath());
  }

  /**
   * 获取工作区信息摘要
   */
  async getSummary(): Promise<{
    agentsCount: number;
    mcpServersCount: number;
    lastSync?: number;
  }> {
    return {
      agentsCount: await this.getAgentsCount(),
      mcpServersCount: Object.keys(this.mcpConfig).length,
      lastSync: this.lastSync,
    };
  }
}

// 工作区管理器类 - 简化为只管理工作区的注册和发现
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map(); // key 是 path
  private readonly GLOBAL_HYPERCHAT_DIR = CONSTANTS.GLOBAL_PATH;
  private globalWorkspace: Workspace;

  constructor() {
    // 创建全局工作区
    this.globalWorkspace = new Workspace(path.dirname(this.GLOBAL_HYPERCHAT_DIR));
    this.initGlobalWorkspace();
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(workspacePath: string, name: string, description?: string): Promise<Workspace> {
    // 检查目录是否存在
    if (!fs.existsSync(workspacePath)) {
      throw new Error(`工作区路径不存在: ${workspacePath}`);
    }

    // 检查工作区是否已存在
    if (this.workspaces.has(workspacePath)) {
      throw new Error(`工作区已存在: ${workspacePath}`);
    }

    // 创建工作区配置
    const config: WorkspaceConfig = {
      key: this.generateWorkspaceKey(),
      name,
      path: workspacePath,
      description,
      created: Date.now(),
      lastAccessed: Date.now(),
      settings: {
        enableMCP: true,
        enableAgents: true,
        enableKnowledgeBase: true,
        autoSave: true,
        syncToCloud: false,
      },
    };

    // 创建工作区实例
    const workspace = new Workspace(workspacePath, config);
    await workspace.init();

    // 注册工作区
    this.workspaces.set(workspacePath, workspace);

    return workspace;
  }

  /**
   * 获取指定工作区
   */
  getWorkspace(workspacePath: string): Workspace | null {
    return this.workspaces.get(workspacePath) || null;
  }

  /**
   * 获取全局工作区
   */
  getGlobalWorkspace(): Workspace {
    return this.globalWorkspace;
  }

  /**
   * 获取所有工作区列表
   */
  getWorkspaceList(): WorkspaceConfig[] {
    return Array.from(this.workspaces.values()).map(workspace => workspace.getConfig());
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(workspacePath: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspacePath);
    if (!workspace) {
      return false;
    }

    // 删除工作区
    const success = await workspace.delete();
    if (success) {
      this.workspaces.delete(workspacePath);
    }

    return success;
  }

  /**
   * 更新工作区文件树
   */
  async updateWorkspaceFileTree(workspacePath: string): Promise<boolean> {
    const workspace = this.workspaces.get(workspacePath);
    if (!workspace) {
      return false;
    }

    return await workspace.updateFileTree({
      includeHidden: false,
      maxDepth: 5,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
    });
  }



  /**
   * 生成新的 agent key
   */
  generateAgentKey(): string {
    return `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
  }

  /**
   * 生成新的工作区 key
   */
  generateWorkspaceKey(): string {
    return `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
  }

  /**
   * 获取指定工作区或全局工作区
   */
  private getWorkspaceInstance(workspacePath: string): Workspace | null {
    if (this.isGlobalWorkspace(workspacePath)) {
      return this.globalWorkspace;
    }
    return this.workspaces.get(workspacePath) || null;
  }

  /**
   * 添加或更新单个 agent
   */
  async addOrUpdateAgent(workspacePath: string, agent: Partial<AgentConfig>): Promise<boolean> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return false;
    }
    return await workspace.setAgent(agent);
  }

  /**
   * 删除单个 agent
   */
  async deleteAgent(workspacePath: string, agentKey: string): Promise<boolean> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return false;
    }
    return await workspace.deleteAgent(agentKey);
  }

  /**
   * 获取指定工作区的所有 agents
   */
  async getWorkspaceAgents(workspacePath: string): Promise<AgentConfig[]> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return [];
    }
    return await workspace.getAgents();
  }

  /**
   * 获取指定工作区的单个 agent
   */
  async getWorkspaceAgent(workspacePath: string, agentKey: string): Promise<AgentConfig | null> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return null;
    }
    return await workspace.getAgent(agentKey);
  }

  /**
   * 加载现有工作区（从已存在的 .hyperchat 文件夹）
   */
  async loadExistingWorkspace(workspacePath: string): Promise<Workspace | null> {
    const workspace = new Workspace(workspacePath);

    // 检查工作区是否存在
    if (!workspace.exists()) {
      return null;
    }

    try {
      // 加载工作区数据
      await workspace.load();

      // 将工作区添加到管理器
      this.workspaces.set(workspacePath, workspace);

      return workspace;
    } catch (error) {
      console.warn(`加载工作区失败 ${workspacePath}:`, error);
      return null;
    }
  }

  /**
   * 检查指定路径是否为工作区（是否包含 .hyperchat 文件夹）
   */
  isWorkspaceDirectory(directoryPath: string): boolean {
    const hyperChatPath = path.join(directoryPath, CONSTANTS.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
  }

  /**
   * 从当前目录获取工作区（如果存在）
   */
  async getWorkspaceFromDirectory(directoryPath: string): Promise<Workspace | null> {
    if (!this.isWorkspaceDirectory(directoryPath)) {
      return null;
    }

    return await this.loadExistingWorkspace(directoryPath);
  }

  /**
   * 初始化全局工作区
   */
  private async initGlobalWorkspace(): Promise<void> {
    try {
      await this.globalWorkspace.init();
    } catch (error) {
      console.warn('初始化全局工作区失败:', error);
    }
  }

  /**
   * 获取全局配置目录路径
   */
  getGlobalConfigPath(): string {
    return this.GLOBAL_HYPERCHAT_DIR;
  }

  /**
   * 从全局配置加载 agents
   */
  async loadGlobalAgents(): Promise<AgentConfig[]> {
    return await this.globalWorkspace.getAgents();
  }

  /**
   * 保存 agent 到全局配置
   */
  async saveGlobalAgent(agent: Partial<AgentConfig>): Promise<boolean> {
    return await this.globalWorkspace.setAgent(agent);
  }

  /**
   * 删除全局 agent
   */
  async deleteGlobalAgent(agentKey: string): Promise<boolean> {
    return await this.globalWorkspace.deleteAgent(agentKey);
  }

  /**
   * 获取合并的 agents（全局 + 工作区）
   */
  async getMergedAgents(workspacePath: string): Promise<AgentConfig[]> {
    const globalAgents = await this.loadGlobalAgents();
    const workspaceAgents = await this.getWorkspaceAgents(workspacePath);

    // 创建一个 Map 来去重，工作区的配置覆盖全局配置
    const mergedAgentsMap = new Map<string, AgentConfig>();

    // 先添加全局 agents
    globalAgents.forEach(agent => {
      mergedAgentsMap.set(agent.key, { ...agent, type: 'builtin' });
    });

    // 再添加工作区 agents，会覆盖同名的全局 agents
    workspaceAgents.forEach(agent => {
      mergedAgentsMap.set(agent.key, { ...agent, type: 'custom' });
    });

    return Array.from(mergedAgentsMap.values());
  }

  /**
   * 获取合并的 MCP 配置（全局 + 工作区）
   */
  async getMergedMcpConfig(workspacePath: string): Promise<Record<string, MCPServerConfig>> {
    const globalConfig = this.globalWorkspace.getMcpConfig();

    const workspace = this.getWorkspaceInstance(workspacePath);
    const workspaceConfig = workspace ? workspace.getMcpConfig() : {};

    // 合并配置，工作区配置覆盖全局配置
    return { ...globalConfig, ...workspaceConfig };
  }

  /**
   * 检查是否为全局工作区
   */
  isGlobalWorkspace(workspacePath: string): boolean {
    return workspacePath === this.GLOBAL_HYPERCHAT_DIR;
  }

  /**
   * 获取全局工作区路径
   */
  getGlobalWorkspacePath(): string {
    return this.GLOBAL_HYPERCHAT_DIR;
  }
}

// 简单的配置数据管理类
export class Data<T> {
  private data: T;
  private loaded = false;

  constructor(
    private fileName: string,
    private defaultData: T,
    private options: { sync?: boolean } = { sync: true }
  ) {
    this.data = defaultData;
  }

  async init(): Promise<T> {
    if (!this.loaded) {
      try {
        const globalConfigPath = CONSTANTS.GLOBAL_PATH;
        const filePath = path.join(globalConfigPath, this.fileName);

        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath, "utf-8");
          this.data = JSON.parse(content);
        }
      } catch (error) {
        console.warn(`加载配置文件 ${this.fileName} 失败:`, error);
      }
      this.loaded = true;
    }
    return this.data;
  }

  async save(): Promise<void> {
    try {
      const globalConfigPath = CONSTANTS.GLOBAL_PATH;
      if (!fs.existsSync(globalConfigPath)) {
        await fs.promises.mkdir(globalConfigPath, { recursive: true });
      }

      const filePath = path.join(globalConfigPath, this.fileName);
      await fs.promises.writeFile(filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.warn(`保存配置文件 ${this.fileName} 失败:`, error);
    }
  }

  get(): T {
    return this.data;
  }

  set(data: T): void {
    this.data = data;
    if (this.options.sync) {
      this.save();
    }
  }
}

// 全局工作区管理器实例
export const workspaceManager = new WorkspaceManager();

// 工作区配置数据存储（全局工作区列表）
export const WorkspaceConfigs = new Data("workspace_configs.json", {
  workspaces: [] as WorkspaceConfig[],
}, {
  sync: true,
});