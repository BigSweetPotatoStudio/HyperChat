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

// 工作区数据结构
export type WorkspaceData = {
  config: WorkspaceConfig;
  agents: DataList<Agent>;
  chatHistory: DataList<ChatHistoryItem>;
  mcpClients: Record<string, IMCPClient>;
  mcpConfig: Record<string, MCPServerConfig>;
  fileTree?: WorkspaceFileNode;
  lastSync?: number;
};

// 工作区管理器类
export class WorkspaceManager {
  private workspaces: Map<string, WorkspaceData> = new Map(); // key 是 path
  private readonly HYPERCHAT_DIR = ".hyperchat";
  private readonly GLOBAL_HYPERCHAT_DIR = path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat');

  constructor() {
    this.loadWorkspaces();
    this.initGlobalWorkspace();
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(workspacePath: string, name: string, description?: string): Promise<WorkspaceConfig> {
    const key = this.generateWorkspaceKey();
    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

    // 检查目录是否存在，不存在则创建
    if (!fs.existsSync(workspacePath)) {
      throw new Error(`工作区路径不存在: ${workspacePath}`);
    }

    // 检查工作区是否已存在
    if (this.workspaces.has(workspacePath)) {
      throw new Error(`工作区已存在: ${workspacePath}`);
    }

    // 创建 .hyperchat 目录结构
    await this.createWorkspaceDirectories(hyperChatPath);

    const config: WorkspaceConfig = {
      key,
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

    const workspaceData: WorkspaceData = {
      config,
      agents: new DataList<Agent>(path.join(hyperChatPath, "agents")),
      chatHistory: new DataList<ChatHistoryItem>(path.join(hyperChatPath, "chats")),
      mcpClients: {},
      mcpConfig: {},
    };

    this.workspaces.set(workspacePath, workspaceData);
    await this.saveWorkspaceConfig(workspacePath);

    return config;
  }

  /**
   * 获取指定工作区
   */
  getWorkspace(workspacePath: string): WorkspaceData | null {
    return this.workspaces.get(workspacePath) || null;
  }

  /**
   * 获取所有工作区列表
   */
  getWorkspaceList(): WorkspaceConfig[] {
    return Array.from(this.workspaces.values()).map(data => data.config);
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(workspacePath: string): Promise<boolean> {
    if (!this.workspaces.has(workspacePath)) {
      return false;
    }

    const workspaceData = this.workspaces.get(workspacePath);
    if (workspaceData) {
      const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

      // 删除工作区文件夹
      if (fs.existsSync(hyperChatPath)) {
        await fs.promises.rm(hyperChatPath, { recursive: true, force: true });
      }
    }

    this.workspaces.delete(workspacePath);

    return true;
  }

  /**
   * 扫描工作区文件树
   */
  async scanWorkspaceFiles(workspacePath: string, options: {
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

  /**
   * 更新工作区文件树
   */
  async updateWorkspaceFileTree(workspacePath: string): Promise<boolean> {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return false;
    }

    try {
      const fileTree = await this.scanWorkspaceFiles(workspacePath, {
        includeHidden: false,
        maxDepth: 5,
        excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
      });

      workspaceData.fileTree = fileTree;
      await this.saveWorkspaceData(workspacePath);
      return true;
    } catch (error) {
      console.error('更新文件树失败:', error);
      return false;
    }
  }

  /**
   * 创建工作区目录结构
   */
  private async createWorkspaceDirectories(hyperChatPath: string): Promise<void> {
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
   * 加载工作区配置
   */
  private async loadWorkspaces(): Promise<void> {
    // 这里应该从全局配置中加载所有工作区信息
    // 暂时为空，后续可以扩展
  }

  /**
   * 保存工作区配置
   */
  private async saveWorkspaceConfig(workspacePath: string): Promise<void> {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return;
    }

    const configPath = path.join(workspacePath, this.HYPERCHAT_DIR, "workspace.json");
    await fs.promises.writeFile(configPath, JSON.stringify(workspaceData.config, null, 2), "utf-8");
  }

  /**
   * 加载工作区数据
   */
  private async loadWorkspaceData(workspacePath: string): Promise<void> {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return;
    }

    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

    // 加载 agents 和 chatHistory 使用 DataList
    await workspaceData.agents.load();
    await workspaceData.chatHistory.load();

    // 加载其他配置文件
    const configFiles = [
      { name: "mcp.json", target: "mcpConfig" },
    ];

    for (const config of configFiles) {
      const filePath = path.join(hyperChatPath, config.name);
      if (fs.existsSync(filePath)) {
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const data = JSON.parse(content);
          (workspaceData as any)[config.target] = data.mcpServers || data;
        } catch (error) {
          console.warn(`加载配置文件 ${config.name} 失败:`, error);
        }
      }
    }
  }

  /**
   * 保存工作区数据
   */
  private async saveWorkspaceData(workspacePath: string): Promise<void> {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return;
    }

    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

    // agents 和 chatHistory 会自动保存，不需要手动处理

    // 保存其他配置文件
    const configFiles = [
      { name: "mcp.json", data: { mcpServers: workspaceData.mcpConfig } },
    ];

    for (const config of configFiles) {
      const filePath = path.join(hyperChatPath, config.name);
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(config.data, null, 2), "utf-8");
      } catch (error) {
        console.warn(`保存配置文件 ${config.name} 失败:`, error);
      }
    }

    workspaceData.lastSync = Date.now();
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
   * 添加或更新单个 agent
   */
  async addOrUpdateAgent(workspacePath: string, agent: Agent): Promise<boolean> {
    // 对于全局工作区，直接使用 DataList
    if (this.isGlobalWorkspace(workspacePath)) {
      const globalAgents = new DataList<Agent>(path.join(workspacePath, "agents"));
      return await globalAgents.set(agent);
    }

    // 对于普通工作区
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return false;
    }

    return await workspaceData.agents.set(agent);
  }

  /**
   * 删除单个 agent
   */
  async deleteAgent(workspacePath: string, agentKey: string): Promise<boolean> {
    // 对于全局工作区，直接使用 DataList
    if (this.isGlobalWorkspace(workspacePath)) {
      const globalAgents = new DataList<Agent>(path.join(workspacePath, "agents"));
      return await globalAgents.delete(agentKey);
    }

    // 对于普通工作区
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return false;
    }

    return await workspaceData.agents.delete(agentKey);
  }

  /**
   * 获取指定工作区的所有 agents
   */
  async getWorkspaceAgents(workspacePath: string): Promise<Agent[]> {
    // 对于全局工作区，直接使用 DataList
    if (this.isGlobalWorkspace(workspacePath)) {
      const globalAgents = new DataList<Agent>(path.join(workspacePath, "agents"));
      return await globalAgents.getAll();
    }

    // 对于普通工作区
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return [];
    }

    return await workspaceData.agents.getAll();
  }

  /**
   * 获取指定工作区的单个 agent
   */
  async getWorkspaceAgent(workspacePath: string, agentKey: string): Promise<Agent | null> {
    // 对于全局工作区，直接使用 DataList
    if (this.isGlobalWorkspace(workspacePath)) {
      const globalAgents = new DataList<Agent>(path.join(workspacePath, "agents"));
      return await globalAgents.get(agentKey);
    }

    // 对于普通工作区
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return null;
    }

    return await workspaceData.agents.get(agentKey);
  }

  /**
   * 加载现有工作区（从已存在的 .hyperchat 文件夹）
   */
  async loadExistingWorkspace(workspacePath: string): Promise<WorkspaceConfig | null> {
    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);
    
    // 检查 .hyperchat 目录是否存在
    if (!fs.existsSync(hyperChatPath)) {
      return null;
    }

    // 检查工作区配置文件是否存在
    const configPath = path.join(hyperChatPath, "workspace.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      // 读取工作区配置
      const content = await fs.promises.readFile(configPath, "utf-8");
      const config = JSON.parse(content) as WorkspaceConfig;

      const workspaceData: WorkspaceData = {
        config,
        agents: new DataList<Agent>(path.join(hyperChatPath, "agents")),
        chatHistory: new DataList<ChatHistoryItem>(path.join(hyperChatPath, "chats")),
        mcpClients: {},
        mcpConfig: {},
      };

      // 将工作区添加到管理器
      this.workspaces.set(workspacePath, workspaceData);
      
      // 加载工作区数据
      await this.loadWorkspaceData(workspacePath);

      return config;
    } catch (error) {
      console.warn(`加载工作区配置失败 ${workspacePath}:`, error);
      return null;
    }
  }

  /**
   * 扫描目录查找所有工作区
   */
  async scanForWorkspaces(rootPath: string): Promise<WorkspaceConfig[]> {
    const workspaces: WorkspaceConfig[] = [];
    
    try {
      const entries = await fs.promises.readdir(rootPath);
      
      for (const entry of entries) {
        const entryPath = path.join(rootPath, entry);
        const stats = await fs.promises.stat(entryPath);
        
        if (stats.isDirectory()) {
          const config = await this.loadExistingWorkspace(entryPath);
          if (config) {
            workspaces.push(config);
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
      // 创建全局 HyperChat 目录结构
      await this.createGlobalDirectories();
    } catch (error) {
      console.warn('初始化全局工作区失败:', error);
    }
  }

  /**
   * 创建全局目录结构（与普通工作区结构相同）
   */
  private async createGlobalDirectories(): Promise<void> {
    // 使用与普通工作区相同的目录结构
    await this.createWorkspaceDirectories(this.GLOBAL_HYPERCHAT_DIR);
  }

  /**
   * 获取全局配置目录路径
   */
  getGlobalConfigPath(): string {
    return this.GLOBAL_HYPERCHAT_DIR;
  }

  /**
   * 获取全局 agents 目录路径
   */
  getGlobalAgentsPath(): string {
    return path.join(this.GLOBAL_HYPERCHAT_DIR, "agents");
  }

  /**
   * 从全局配置加载 agents（使用 DataList）
   */
  async loadGlobalAgents(): Promise<Agent[]> {
    const globalAgents = new DataList<Agent>(path.join(this.GLOBAL_HYPERCHAT_DIR, "agents"));
    return await globalAgents.getAll();
  }

  /**
   * 保存 agent 到全局配置（使用统一的保存逻辑）
   */
  async saveGlobalAgent(agent: Agent): Promise<boolean> {
    return await this.addOrUpdateAgent(this.GLOBAL_HYPERCHAT_DIR, agent);
  }

  /**
   * 删除全局 agent（使用统一的删除逻辑）
   */
  async deleteGlobalAgent(agentKey: string): Promise<boolean> {
    return await this.deleteAgent(this.GLOBAL_HYPERCHAT_DIR, agentKey);
  }

  /**
   * 获取全局 MCP 配置路径
   */
  getGlobalMcpConfigPath(): string {
    return path.join(this.GLOBAL_HYPERCHAT_DIR, "mcp.json");
  }

  /**
   * 获取全局 AI 模型配置路径
   */
  getGlobalAiModelsConfigPath(): string {
    return path.join(this.GLOBAL_HYPERCHAT_DIR, "ai_models.json");
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
    const globalMcpPath = this.getGlobalMcpConfigPath();
    const workspaceMcpPath = path.join(workspacePath, this.HYPERCHAT_DIR, "mcp.json");
    
    let globalConfig: Record<string, MCPServerConfig> = {};
    let workspaceConfig: Record<string, MCPServerConfig> = {};
    
    // 加载全局 MCP 配置
    try {
      if (fs.existsSync(globalMcpPath)) {
        const content = await fs.promises.readFile(globalMcpPath, "utf-8");
        const data = JSON.parse(content);
        globalConfig = data.mcpServers || {};
      }
    } catch (error) {
      console.warn('加载全局 MCP 配置失败:', error);
    }
    
    // 加载工作区 MCP 配置
    try {
      if (fs.existsSync(workspaceMcpPath)) {
        const content = await fs.promises.readFile(workspaceMcpPath, "utf-8");
        const data = JSON.parse(content);
        workspaceConfig = data.mcpServers || {};
      }
    } catch (error) {
      console.warn('加载工作区 MCP 配置失败:', error);
    }
    
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