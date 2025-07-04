import { Data } from "./data.mjs";
import { Agent, ChatHistoryItem, IMCPClient, MCPServerConfig } from "./data.mjs";
import { v4 } from "uuid";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";
import dayjs from "dayjs";
import * as os from "os";

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
  agents: Agent[];
  chatHistory: ChatHistoryItem[];
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
      agents: [],
      chatHistory: [],
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
      path.join(hyperChatPath, "agents", "chats"),
      path.join(hyperChatPath, "agents", "memory"),
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
      { name: "chat_history.json", content: JSON.stringify({ data: [] }, null, 2) },
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

    // 加载 agents 文件夹
    await this.loadAgents(workspaceData, hyperChatPath);

    // 加载其他配置文件
    const configFiles = [
      { name: "chat_history.json", target: "chatHistory" },
      { name: "mcp.json", target: "mcpConfig" },
    ];

    for (const config of configFiles) {
      const filePath = path.join(hyperChatPath, config.name);
      if (fs.existsSync(filePath)) {
        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const data = JSON.parse(content);
          (workspaceData as any)[config.target] = data.data || data;
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

    // 保存 agents 文件夹
    await this.saveAgents(workspaceData, hyperChatPath);

    // 保存其他配置文件
    const configFiles = [
      { name: "chat_history.json", data: { data: workspaceData.chatHistory } },
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
   * 加载 agents 文件夹中的所有 agent 配置
   */
  private async loadAgents(workspaceData: WorkspaceData, hyperChatPath: string): Promise<void> {
    const agentsPath = path.join(hyperChatPath, "agents");

    if (!fs.existsSync(agentsPath)) {
      workspaceData.agents = [];
      return;
    }

    try {
      const files = await fs.promises.readdir(agentsPath);
      const agents: Agent[] = [];

      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('.')) {
          const filePath = path.join(agentsPath, file);
          try {
            const content = await fs.promises.readFile(filePath, "utf-8");
            const agent = JSON.parse(content) as Agent;

            // 确保 agent 有必要的字段
            if (agent.key && agent.name) {
              agents.push(agent);
            }
          } catch (error) {
            console.warn(`加载 agent 文件 ${file} 失败:`, error);
          }
        }
      }

      workspaceData.agents = agents;
    } catch (error) {
      console.warn(`读取 agents 文件夹失败:`, error);
      workspaceData.agents = [];
    }
  }

  /**
   * 保存 agents 到文件夹中的单独文件
   */
  private async saveAgents(workspaceData: WorkspaceData, hyperChatPath: string): Promise<void> {
    const agentsPath = path.join(hyperChatPath, "agents");

    // 确保 agents 文件夹存在
    if (!fs.existsSync(agentsPath)) {
      await fs.promises.mkdir(agentsPath, { recursive: true });
    }

    // 获取现有的 agent 文件
    const existingFiles = new Set<string>();
    try {
      const files = await fs.promises.readdir(agentsPath);
      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('.')) {
          existingFiles.add(file);
        }
      }
    } catch (error) {
      console.warn(`读取 agents 文件夹失败:`, error);
    }

    // 保存当前的 agents
    const currentFiles = new Set<string>();
    for (const agent of workspaceData.agents) {
      const filename = this.getAgentFileName(agent);
      currentFiles.add(filename);

      const filePath = path.join(agentsPath, filename);
      try {
        await fs.promises.writeFile(filePath, JSON.stringify(agent, null, 2), "utf-8");
      } catch (error) {
        console.warn(`保存 agent 文件 ${filename} 失败:`, error);
      }
    }

    // 删除不再存在的 agent 文件
    for (const existingFile of existingFiles) {
      if (!currentFiles.has(existingFile)) {
        const filePath = path.join(agentsPath, existingFile);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn(`删除旧的 agent 文件 ${existingFile} 失败:`, error);
        }
      }
    }
  }

  /**
   * 生成 agent 文件名
   */
  private getAgentFileName(agent: Agent): string {
    // 使用 agent 的 key 作为文件名，确保唯一性
    return `${agent.key}.json`;
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
    // 对于全局工作区，需要特殊处理，因为它可能不在 workspaces Map 中
    if (this.isGlobalWorkspace(workspacePath)) {
      // 确保全局工作区目录存在
      if (!fs.existsSync(workspacePath)) {
        await this.createGlobalDirectories();
      }
    } else {
      const workspaceData = this.workspaces.get(workspacePath);
      if (!workspaceData) {
        return false;
      }
    }

    // 如果没有 key，生成新的 key
    if (!agent.key) {
      agent.key = this.generateAgentKey();
    }

    // 更新内存中的 agents（如果不是全局工作区）
    if (!this.isGlobalWorkspace(workspacePath)) {
      const workspaceData = this.workspaces.get(workspacePath);
      if (workspaceData) {
        const existingIndex = workspaceData.agents.findIndex(a => a.key === agent.key);
        if (existingIndex >= 0) {
          workspaceData.agents[existingIndex] = agent;
        } else {
          workspaceData.agents.push(agent);
        }
      }
    }

    // 保存到文件（统一逻辑）
    const agentsPath = path.join(workspacePath, "agents");
    
    // 确保 agents 文件夹存在
    if (!fs.existsSync(agentsPath)) {
      await fs.promises.mkdir(agentsPath, { recursive: true });
    }

    const filename = this.getAgentFileName(agent);
    const filePath = path.join(agentsPath, filename);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(agent, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存 agent 文件失败:`, error);
      return false;
    }
  }

  /**
   * 删除单个 agent
   */
  async deleteAgent(workspacePath: string, agentKey: string): Promise<boolean> {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return false;
    }

    // 从内存中删除
    const agentIndex = workspaceData.agents.findIndex(a => a.key === agentKey);
    if (agentIndex < 0) {
      return false;
    }

    const agent = workspaceData.agents[agentIndex];
    workspaceData.agents.splice(agentIndex, 1);

    // 删除文件
    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);
    const agentsPath = path.join(hyperChatPath, "agents");
    if (!agent) {
      console.warn(`Agent with key ${agentKey} not found in workspace ${workspacePath}`);
      return false;
    }
    const filename = this.getAgentFileName(agent);
    const filePath = path.join(agentsPath, filename);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.warn(`删除 agent 文件失败:`, error);
      return false;
    }
  }

  /**
   * 获取指定工作区的所有 agents
   */
  getWorkspaceAgents(workspacePath: string): Agent[] {
    const workspaceData = this.workspaces.get(workspacePath);
    return workspaceData ? workspaceData.agents : [];
  }

  /**
   * 获取指定工作区的单个 agent
   */
  getWorkspaceAgent(workspacePath: string, agentKey: string): Agent | null {
    const workspaceData = this.workspaces.get(workspacePath);
    if (!workspaceData) {
      return null;
    }

    return workspaceData.agents.find(a => a.key === agentKey) || null;
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
        agents: [],
        chatHistory: [],
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
   * 从全局配置加载 agents（使用统一的加载逻辑）
   */
  async loadGlobalAgents(): Promise<Agent[]> {
    // 创建临时的工作区数据对象
    const tempWorkspaceData: WorkspaceData = {
      config: {
        key: 'global',
        name: 'Global',
        path: this.GLOBAL_HYPERCHAT_DIR,
        description: 'Global HyperChat Configuration',
        created: Date.now(),
        lastAccessed: Date.now(),
        settings: {
          enableMCP: true,
          enableAgents: true,
          enableKnowledgeBase: true,
          autoSave: true,
          syncToCloud: false,
        },
      },
      agents: [],
      chatHistory: [],
      mcpClients: {},
      mcpConfig: {},
    };

    // 使用统一的 loadAgents 方法
    await this.loadAgents(tempWorkspaceData, this.GLOBAL_HYPERCHAT_DIR);
    return tempWorkspaceData.agents;
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
    const workspaceAgents = this.getWorkspaceAgents(workspacePath);
    
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

// 全局工作区管理器实例
export const workspaceManager = new WorkspaceManager();

// 工作区配置数据存储（全局工作区列表）
export const WorkspaceConfigs = new Data("workspace_configs.json", {
  workspaces: [] as WorkspaceConfig[],
}, {
  sync: true,
});