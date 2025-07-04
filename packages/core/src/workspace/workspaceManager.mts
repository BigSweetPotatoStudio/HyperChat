import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { CONSTANTS } from "./constants.mjs";
import { 
  WorkspaceConfig, 
  AgentConfig, 
  MCPServerConfig 
} from "./types.mjs";
import { Workspace } from "./workspace.mjs";

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
      name,
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