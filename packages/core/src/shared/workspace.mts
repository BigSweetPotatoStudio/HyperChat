import { v4 } from "uuid";
import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import * as os from "os";

// 重新实现需要的类型定义
export type Agent = {
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
};

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
 * 文件夹数据列表管理类
 * 专门处理一个文件夹中全部是同一种类型文件的情况
 */
export class DataList<T extends { key: string }> {
  private items: Map<string, T> = new Map();
  private loaded = false;

  constructor(
    private dirPath: string,
    private getItemKey: (item: T) => string = (item) => item.key,
    private generateKey: () => string = () => `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`
  ) {}

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
    this.items.clear();

    if (!fs.existsSync(this.dirPath)) {
      this.loaded = true;
      return;
    }

    try {
      const files = await fs.promises.readdir(this.dirPath);

      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('.')) {
          const filePath = path.join(this.dirPath, file);
          try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const item = JSON.parse(content) as T;
            
            // 确保 item 有必要的字段
            if (item && typeof item === 'object' && 'key' in item && item.key) {
              this.items.set(this.getItemKey(item), item);
            }
          } catch (error) {
            console.warn(`加载文件 ${file} 失败:`, error);
          }
        }
      }
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

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
      
      // 更新内存中的数据
      await this.ensureLoaded();
      this.items.set(key, item);
      
      return true;
    } catch (error) {
      console.warn(`保存文件 ${filename} 失败:`, error);
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
      console.warn(`删除文件 ${filename} 失败:`, error);
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

    // 保存当前的项目
    const currentFiles = new Set<string>();
    let success = true;

    for (const item of items) {
      // 如果没有 key，生成新的 key
      if (!item.key) {
        (item as any).key = this.generateKey();
      }

      const key = this.getItemKey(item);
      const filename = this.getFileName(key);
      currentFiles.add(filename);
      
      const filePath = path.join(this.dirPath, filename);
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(item, null, 2), "utf-8");
      } catch (error) {
        console.warn(`保存文件 ${filename} 失败:`, error);
        success = false;
      }
    }

    // 删除不再存在的文件
    for (const existingFile of existingFiles) {
      if (!currentFiles.has(existingFile)) {
        const filePath = path.join(this.dirPath, existingFile);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn(`删除旧文件 ${existingFile} 失败:`, error);
        }
      }
    }

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
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('.')) {
            const filePath = path.join(this.dirPath, file);
            await fs.promises.unlink(filePath);
          }
        }
      }

      this.items.clear();
      return true;
    } catch (error) {
      console.warn(`清空目录失败:`, error);
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
  private agents: DataList<Agent>;
  private chatHistory: DataList<ChatHistoryItem>;
  private mcpConfig: Record<string, MCPServerConfig> = {};
  private mcpClients: Record<string, IMCPClient> = {};
  private fileTree?: WorkspaceFileNode;
  private lastSync?: number;
  private readonly HYPERCHAT_DIR = ".hyperchat";

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

    this.agents = new DataList<Agent>(path.join(hyperChatPath, "agents"));
    this.chatHistory = new DataList<ChatHistoryItem>(path.join(hyperChatPath, "chats"));
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
      path.join(hyperChatPath, "agents"),
      path.join(hyperChatPath, "chats"),
      path.join(hyperChatPath, "knowledge"),
      path.join(hyperChatPath, "temp"),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }

    // 创建默认配置文件
    const defaultFiles = [
      { name: "mcp.json", content: JSON.stringify({ mcpServers: {} }, null, 2) },
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

    // 加载 agents 和 chatHistory
    await this.agents.load();
    await this.chatHistory.load();

    // 加载 MCP 配置
    await this.loadMcpConfig();

    this.config.lastAccessed = Date.now();
  }

  /**
   * 加载工作区配置
   */
  private async loadConfig(): Promise<void> {
    const configPath = path.join(this.getHyperChatPath(), "workspace.json");
    
    if (fs.existsSync(configPath)) {
      try {
        const content = await fs.promises.readFile(configPath, "utf-8");
        const config = JSON.parse(content) as WorkspaceConfig;
        this.config = { ...this.config, ...config };
      } catch (error) {
        console.warn(`加载工作区配置失败:`, error);
      }
    }
  }

  /**
   * 加载 MCP 配置
   */
  private async loadMcpConfig(): Promise<void> {
    const mcpPath = path.join(this.getHyperChatPath(), "mcp.json");
    
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
    const configPath = path.join(this.getHyperChatPath(), "workspace.json");
    
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
    const mcpPath = path.join(this.getHyperChatPath(), "mcp.json");
    
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
  async getAgents(): Promise<Agent[]> {
    return await this.agents.getAll();
  }

  /**
   * 获取单个 agent
   */
  async getAgent(key: string): Promise<Agent | null> {
    return await this.agents.get(key);
  }

  /**
   * 添加或更新 agent
   */
  async setAgent(agent: Agent): Promise<boolean> {
    return await this.agents.set(agent);
  }

  /**
   * 删除 agent
   */
  async deleteAgent(key: string): Promise<boolean> {
    return await this.agents.delete(key);
  }

  /**
   * 获取所有 agents 数量
   */
  async getAgentsCount(): Promise<number> {
    return await this.agents.size();
  }

  // ========== Chat History 管理 ==========

  /**
   * 获取所有聊天历史
   */
  async getChatHistory(): Promise<ChatHistoryItem[]> {
    return await this.chatHistory.getAll();
  }

  /**
   * 获取单个聊天历史
   */
  async getChatHistoryItem(key: string): Promise<ChatHistoryItem | null> {
    return await this.chatHistory.get(key);
  }

  /**
   * 添加或更新聊天历史
   */
  async setChatHistoryItem(item: ChatHistoryItem): Promise<boolean> {
    return await this.chatHistory.set(item);
  }

  /**
   * 删除聊天历史
   */
  async deleteChatHistoryItem(key: string): Promise<boolean> {
    return await this.chatHistory.delete(key);
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
    chatHistoryCount: number;
    mcpServersCount: number;
    lastSync?: number;
  }> {
    return {
      agentsCount: await this.getAgentsCount(),
      chatHistoryCount: await this.chatHistory.size(),
      mcpServersCount: Object.keys(this.mcpConfig).length,
      lastSync: this.lastSync,
    };
  }
}

// 工作区管理器类 - 简化为只管理工作区的注册和发现
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map(); // key 是 path
  private readonly GLOBAL_HYPERCHAT_DIR = path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat');
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
  async addOrUpdateAgent(workspacePath: string, agent: Agent): Promise<boolean> {
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
  async getWorkspaceAgents(workspacePath: string): Promise<Agent[]> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return [];
    }
    return await workspace.getAgents();
  }

  /**
   * 获取指定工作区的单个 agent
   */
  async getWorkspaceAgent(workspacePath: string, agentKey: string): Promise<Agent | null> {
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
   * 扫描目录查找所有工作区
   */
  async scanForWorkspaces(rootPath: string): Promise<Workspace[]> {
    const workspaces: Workspace[] = [];
    
    try {
      const entries = await fs.promises.readdir(rootPath);
      
      for (const entry of entries) {
        const entryPath = path.join(rootPath, entry);
        const stats = await fs.promises.stat(entryPath);
        
        if (stats.isDirectory()) {
          const workspace = await this.loadExistingWorkspace(entryPath);
          if (workspace) {
            workspaces.push(workspace);
          }
        }
      }
    } catch (error) {
      console.warn(`扫描工作区失败 ${rootPath}:`, error);
    }

    return workspaces;
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
  async loadGlobalAgents(): Promise<Agent[]> {
    return await this.globalWorkspace.getAgents();
  }

  /**
   * 保存 agent 到全局配置
   */
  async saveGlobalAgent(agent: Agent): Promise<boolean> {
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
  async getMergedAgents(workspacePath: string): Promise<Agent[]> {
    const globalAgents = await this.loadGlobalAgents();
    const workspaceAgents = await this.getWorkspaceAgents(workspacePath);
    
    // 创建一个 Map 来去重，工作区的配置覆盖全局配置
    const mergedAgentsMap = new Map<string, Agent>();
    
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
        const globalConfigPath = path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat');
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
      const globalConfigPath = path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat');
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