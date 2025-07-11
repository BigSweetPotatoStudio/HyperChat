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
  validateWorkspaceConfig 
} from "./types.mjs";
import type { ChatHistoryItem } from "@hyperchat/shared/types";
import type { MCPServerConfig } from "@hyperchat/shared/types";
import { AgentManager } from "./agentManager.mjs";
import { getMCPManager } from "./mcp/index.mjs";
import type { WorkspaceMCPClientImpl } from "./mcp/client.mjs";
import { WorkspaceSettingsManager } from "../data/workspaceSettingsManager.mjs";

/**
 * 工作区类 - 封装单个工作区的所有操作
 */
export class Workspace {
  private config: WorkspaceConfig;
  private agentManager: AgentManager;
  private mcpManager: ReturnType<typeof getMCPManager>;
  private settingsManager: WorkspaceSettingsManager;
  private fileTree?: WorkspaceFileNode;
  private lastSync?: number;
  private readonly HYPERCHAT_DIR = CONSTANTS.HYPERCHAT_DIR;
  private isGlobal: boolean;

  constructor(private workspacePath: string, config?: WorkspaceConfig) {
    // 检查是否为全局工作区
    this.isGlobal = workspacePath === CONSTANTS.GLOBAL_PATH;
    
    // 检查当前目录是否是工作区
    const isCurrentDirWorkspace = this.isWorkspaceDirectory(workspacePath);
    
    // 如果不是工作区且不是全局工作区，则使用全局工作区路径
    const effectiveWorkspacePath = isCurrentDirWorkspace || this.isGlobal 
      ? workspacePath 
      : CONSTANTS.GLOBAL_PATH;
      
    const hyperChatPath = path.join(effectiveWorkspacePath, this.HYPERCHAT_DIR);

    this.config = config || {
      name: this.isGlobal ? 'Global Workspace' : path.basename(workspacePath),
      created: Date.now(),
      lastAccessed: Date.now(),
      settings: {
        enableKnowledgeBase: true,
      },
    };

    this.agentManager = new AgentManager(path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS));
    
    // 使用有效的工作区路径作为MCP管理器的路径
    this.mcpManager = getMCPManager(effectiveWorkspacePath);
    
    // 初始化设置管理器
    this.settingsManager = new WorkspaceSettingsManager(hyperChatPath);
  }

  /**
   * 检查指定路径是否为工作区（是否包含 .hyperchat 文件夹）
   */
  private isWorkspaceDirectory(directoryPath: string): boolean {
    const hyperChatPath = path.join(directoryPath, this.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
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

    // MCP 管理器不需要显式初始化

    // 初始化设置管理器
    await this.settingsManager.init();

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

    // 加载配置文件（支持全局+工作区合并）
    await this.loadMergedConfig();

    // 加载 agents
    await this.agentManager.init();

    // 加载工作区 MCP 配置并启动客户端
    // 启动MCP客户端
    await this.mcpManager.startClients();

    this.config.lastAccessed = Date.now();
  }

  /**
   * 加载合并的配置（全局 + 工作区）
   */
  private async loadMergedConfig(): Promise<void> {
    // 检查当前目录是否是工作区
    const isCurrentDirWorkspace = this.isWorkspaceDirectory(this.workspacePath);
    
    if (isCurrentDirWorkspace && !this.isGlobal) {
      // 如果是工作区且不是全局工作区，先加载全局配置，再合并当前工作区配置
      await this.loadGlobalConfig();
      await this.loadWorkspaceConfig();
    } else {
      // 如果不是工作区或者是全局工作区，直接加载当前配置
      await this.loadWorkspaceConfig();
    }
  }

  /**
   * 加载全局工作区配置
   */
  private async loadGlobalConfig(): Promise<void> {
    const globalConfigPath = path.join(CONSTANTS.GLOBAL_PATH, this.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.WORKSPACE);
    
    if (fs.existsSync(globalConfigPath)) {
      try {
        const content = await fs.promises.readFile(globalConfigPath, "utf-8");
        const globalConfig = JSON.parse(content);

        if (validateWorkspaceConfig(globalConfig)) {
          // 将全局配置作为基础配置
          this.config = { ...this.config, ...globalConfig };
        }
      } catch (error) {
        console.warn(`加载全局工作区配置失败:`, error);
      }
    }
  }

  /**
   * 加载工作区配置
   */
  private async loadWorkspaceConfig(): Promise<void> {
    const configPath = path.join(this.getHyperChatPath(), CONSTANTS.CONFIG_FILES.WORKSPACE);

    if (fs.existsSync(configPath)) {
      try {
        const content = await fs.promises.readFile(configPath, "utf-8");
        const config = JSON.parse(content);

        if (validateWorkspaceConfig(config)) {
          // 工作区配置覆盖全局配置
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
   * 保存所有数据
   */
  async save(): Promise<void> {
    await this.saveConfig();
    this.lastSync = Date.now();
  }

  // ========== Agent 管理 ==========

  /**
   * 获取所有 agents（支持全局+工作区合并）
   */
  async getAgents(): Promise<AgentConfig[]> {
    // 检查当前目录是否是工作区
    const isCurrentDirWorkspace = this.isWorkspaceDirectory(this.workspacePath);
    
    if (isCurrentDirWorkspace && !this.isGlobal) {
      // 如果是工作区且不是全局工作区，获取合并的Agents
      return await this.getMergedAgents();
    } else {
      // 如果不是工作区或者是全局工作区，直接返回当前AgentManager的Agents
      return await this.agentManager.getAllAgents();
    }
  }

  /**
   * 获取合并的 agents（全局 + 当前工作区）
   */
  async getMergedAgents(): Promise<AgentConfig[]> {
    // 获取全局Agents
    const globalAgentManager = new (await import('./agentManager.mjs')).AgentManager(
      path.join(CONSTANTS.GLOBAL_PATH, this.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS)
    );
    await globalAgentManager.init();
    const globalAgents = await globalAgentManager.getAllAgents();
    
    // 获取当前工作区Agents
    const workspaceAgents = await this.agentManager.getAllAgents();

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
   * 获取所有 agents (别名，为了兼容性)
   */
  async getAllAgents(): Promise<AgentConfig[]> {
    return await this.agentManager.getAllAgents();
  }

  /**
   * 获取所有 agents 摘要信息
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    return await this.agentManager.getAllAgentsSummary();
  }

  /**
   * 创建新的 agent
   */
  async createAgent(config: Partial<AgentConfig>): Promise<import("./agentManager.mjs").AgentInstance | null> {
    return await this.agentManager.createAgent(config);
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

  /**
   * 清空 Agent 所有聊天记录
   */
  async clearAgentChatLogs(agentKey: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.clearChatLogs() : false;
  }

  /**
   * 获取 Agent 聊天记录数量
   */
  async getAgentChatLogsCount(agentKey: string): Promise<number> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getChatLogsCount() : 0;
  }

  /**
   * 获取 Agent 摘要信息
   */
  async getAgentSummary(agentKey: string): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  } | null> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getSummary() : null;
  }

  // ========== MCP 管理 ==========

  /**
   * 获取 MCP 客户端
   */
  getMcpClients(): WorkspaceMCPClientImpl[] {
    return this.mcpManager.getClientsByWorkspace();
  }

  /**
   * 获取所有 MCP 客户端（包含全局的）
   */
  getAllMcpClients(): WorkspaceMCPClientImpl[] {
    return this.mcpManager.getAllClients();
  }

  /**
   * 添加或更新单个 MCP 服务器配置
   */
  async setMcpServer(name: string, config: MCPServerConfig): Promise<void> {
    await this.mcpManager.setServerConfig(name, config);
  }

  /**
   * 删除 MCP 服务器配置
   */
  async deleteMcpServer(name: string): Promise<void> {
    await this.mcpManager.deleteServerConfig(name);
  }

  /**
   * 启动 MCP 客户端
   */
  async startMcpClients(): Promise<void> {
    await this.mcpManager.startClients();
  }

  /**
   * 停止 MCP 客户端
   */
  async stopMcpClients(): Promise<void> {
    await this.mcpManager.stopClients();
  }

  /**
   * 重启 MCP 客户端
   */
  async restartMcpClient(name: string): Promise<void> {
    await this.mcpManager.restartClient(name);
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
      // 停止 MCP 客户端
      await this.stopMcpClients();
      
      // 销毁 MCP 管理器
      await this.mcpManager.destroy();

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
   * 获取设置管理器
   */
  getSettingsManager(): WorkspaceSettingsManager {
    return this.settingsManager;
  }

  /**
   * 获取设置
   */
  getSettings() {
    return this.settingsManager.getSettings();
  }

  /**
   * 更新设置
   */
  async updateSettings(updates: Parameters<WorkspaceSettingsManager['updateSettings']>[0]) {
    return this.settingsManager.updateSettings(updates);
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
      mcpServersCount: this.getMcpClients().length,
      lastSync: this.lastSync,
    };
  }
}