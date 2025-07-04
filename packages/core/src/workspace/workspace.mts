import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { CONSTANTS } from "./constants.mjs";
import { 
  WorkspaceConfig, 
  WorkspaceSettings, 
  WorkspaceFileNode, 
  AgentConfig, 
  ChatHistoryItem, 
  MCPServerConfig, 
  IMCPClient,
  validateWorkspaceConfig 
} from "./types.mjs";
import { AgentManager } from "./agentManager.mjs";

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

  constructor(private workspacePath: string, config?: WorkspaceConfig) {
    const hyperChatPath = path.join(workspacePath, this.HYPERCHAT_DIR);

    this.config = config || {
      name: path.basename(workspacePath),
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
   * 获取 .hyperchat 目录路径
   */
  getHyperChatPath(): string {
    return path.join(this.workspacePath, this.HYPERCHAT_DIR);
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
  getAgentInstance(key: string): import("./agentManager.mjs").AgentInstance | null {
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
      this.fileTree = await this.scanFiles(this.workspacePath, options);
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