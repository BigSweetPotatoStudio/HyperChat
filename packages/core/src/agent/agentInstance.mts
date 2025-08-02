import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { CONSTANTS } from "./constants.mjs";

import { DataList } from "./dataList.mjs";
import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig } from "@dadigua/hyperchat-shared";
import type { ChatHistoryItem, HyperChatCompletionTool } from "@dadigua/hyperchat-shared/types";
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import type { WorkspaceMCPConfig } from "./mcp/types.mjs";
import { MCPManager } from "./mcp/manager.mjs";
import { TaskQueue } from "../utils/taskQueue.mjs";

/**
 * Agent 类 - 管理单个 Agent 的配置和聊天记录
 */
export class AgentInstance {
  private config: AgentConfig;
  private chatLogs: DataList<ChatHistoryItem> | null = null; // 延迟初始化
  private agentPath: string;
  private configPath: string;
  private mcpConfigPath: string;
  private initialized: boolean = false;
  private mcpManager?: MCPManager; // Agent专属MCP管理器

  // 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
  private static chatLogQueue = new TaskQueue({ concurrency: 1 });
  constructor(agentPath: string, config?: AgentConfig) {
    this.agentPath = agentPath;
    this.configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
    this.mcpConfigPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.MCP);

    this.config = config || {
      name: path.basename(agentPath),
      prompt: '',
      allowMCPs: [],
      blockMCPTools: [],
      isConfirmCallTool: false,
      maxTokens: 4000,
      maxContextTokens: 32000,
      tags: [],
      subAgents: [],
      version: 1,
    };

    // 加载配置
    this.loadConfig();

    this.mcpManager = new MCPManager(this.deriveWorkspacePath(), {
      allowMCPs: this.config.allowMCPs
    });
  }

  /**
   * 初始化Agent（只在需要时才调用）
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return; // 已初始化，直接返回
    }

    // 创建目录结构
    await this.createDirectories();


    // 初始化聊天记录管理器
    this.chatLogs = new DataList<ChatHistoryItem>(
      path.join(this.agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
      DataList.FileFormat.YAML
    );

    this.initialized = true;
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
  private loadConfig() {
    // 确保 key 始终与文件夹名称保持一致
    const folderName = path.basename(this.agentPath);
    this.config.name = folderName;

    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, "utf-8");
        const config = yaml.load(content) as AgentConfig;

        // 合并配置
        this.config = { ...this.config, ...config };

        // 使用文件夹名称作为 name
        this.config.name = folderName;

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
   * 确保初始化（内部使用）
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
  /**
   * 从Agent路径推导工作区路径
   * 例如: /path/to/workspace/.hyperchat/agents/agentName -> /path/to/workspace/.hyperchat
   */
  private deriveWorkspacePath(): string {
    // 简单的路径推导逻辑：往上找到包含.hyperchat的目录
    let currentPath = this.agentPath;
    while (currentPath !== path.dirname(currentPath)) {
      const parent = path.dirname(currentPath);
      if (path.basename(parent) === '.hyperchat') {
        return parent;
      }
      currentPath = parent;
    }
    // 如果找不到，返回当前路径的上级目录
    return this.agentPath;
  }
  /**
   * 获取Agent配置（无需初始化）
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * 获取Agent路径
   */
  getAgentPath(): string {
    return this.agentPath;
  }

  /**
   * 更新 Agent 配置
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<boolean> {
    const oldName = this.config.name;
    const newName = updates.name;
    const oldAllowMCPs = this.config.allowMCPs;

    // 如果名称发生变更，需要重命名文件夹
    if (newName && newName !== oldName) {
      const oldPath = this.agentPath;
      const parentPath = path.dirname(oldPath);
      const newPath = path.join(parentPath, sanitizeFileName(newName));

      // 检查新路径是否已存在
      if (fs.existsSync(newPath)) {
        throw new Error(`Agent 名称 "${newName}" 已存在，无法重命名`);
      }

      try {
        // 重命名文件夹
        await fs.promises.rename(oldPath, newPath);

        // 更新实例路径
        this.agentPath = newPath;
        this.configPath = path.join(newPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);

        // 更新MCP路径
        this.mcpConfigPath = path.join(newPath, CONSTANTS.CONFIG_FILES.MCP);

        // 重置chatLogs（如果已初始化）
        if (this.initialized && this.chatLogs) {
          this.chatLogs = new DataList<ChatHistoryItem>(
            path.join(newPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
            DataList.FileFormat.YAML
          );
        }

      } catch (error) {
        console.error(`重命名 Agent 文件夹失败: ${oldName} -> ${newName}:`, error);
        throw new Error(`重命名 Agent 文件夹失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 更新配置
    this.config = { ...this.config, ...updates };
    return await this.saveConfig();
  }

  /**
   * 获取所有聊天记录（使用分页，避免内存压力）
   */
  async getChatLogs(limit: number = 10): Promise<ChatHistoryItem[]> {
    await this.ensureInitialized();

    if (limit) {
      const result = await this.chatLogs!.getPage(0, limit);
      return result.items;
    }
    // 使用deprecated方法，会显示警告提示
    return await this.chatLogs!.getAll();
  }

  /**
   * 分页获取聊天记录
   */
  async getChatLogsPage(offset: number = 0, limit: number = 10): Promise<{ chatLogs: ChatHistoryItem[]; total: number; hasMore: boolean }> {
    await this.ensureInitialized();
    return await this.chatLogs!.getPage(offset, limit).then(result => {
      return {
        chatLogs: result.items,
        total: result.total,
        hasMore: result.hasMore
      }
    });
  }

  /**
   * 获取单个聊天记录
   */
  async getChatLog(key: string): Promise<ChatHistoryItem | null> {
    await this.ensureInitialized();
    return await this.chatLogs!.get(key);
  }

  /**
   * 添加或更新聊天记录
   */
  async setChatLog(chatLog: ChatHistoryItem): Promise<boolean> {
    await this.ensureInitialized();
    // 确保聊天记录与当前Agent关联
    chatLog.agentName = this.config.name;

    // 使用TaskQueue确保顺序写入，避免YAML文件并发问题
    return await AgentInstance.chatLogQueue.add(async () => {
      return await this.chatLogs!.set(chatLog);
    });
  }

  /**
   * 删除聊天记录
   */
  async deleteChatLog(key: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.chatLogs!.delete(key);
  }

  /**
   * 清空所有聊天记录
   */
  async clearChatLogs(): Promise<boolean> {
    await this.ensureInitialized();
    return await this.chatLogs!.clear();
  }

  /**
   * 获取聊天记录数量
   */
  async getChatLogsCount(): Promise<number> {
    await this.ensureInitialized();
    return await this.chatLogs!.size();
  }

  /**
   * 检查 Agent 是否存在
   */
  exists(): boolean {
    return fs.existsSync(this.agentPath) && fs.existsSync(this.configPath);
  }

  /**
   * 删除整个 Agent（包括专属的MCP配置）
   */
  async delete(): Promise<boolean> {
    try {
      // 停止MCP客户端
      await this.stopMCPClients();

      if (this.mcpManager) {
        await this.mcpManager.destroy();
      }

      if (fs.existsSync(this.agentPath)) {
        // 递归删除整个Agent目录，包括:
        // - agent.yaml (Agent配置)
        // - memory.md (Agent记忆)
        // - chatlogs/ (聊天记录)
        // - mcp.json (Agent专属MCP配置)
        await fs.promises.rm(this.agentPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.warn(`删除 Agent 失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 获取 Agent 摘要信息（包含MCP统计）
   */
  async getSummary(): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
    hasMCPConfig: boolean;
  }> {
    // 使用轻量级统计避免加载所有聊天记录内容
    await this.ensureInitialized();
    const stats = await this.chatLogs!.getStats();

    return {
      config: this.config,
      chatLogsCount: stats.count,
      lastChatTime: stats.lastModified,
      hasMCPConfig: await this.hasMCPConfig(),
    };
  }

  // ==================== Agent专属MCP管理 ====================

  /**
   * 获取Agent专属MCP管理器
   */
  getMcpManager(): MCPManager {
    if (!this.mcpManager) {
      throw new Error(`Agent ${this.config.name} MCP Manager is not initialized`);
    }
    return this.mcpManager;
  }

  /**
   * 设置Agent专属MCP管理器
   */
  setMcpManager(mcpManager: MCPManager): void {
    this.mcpManager = mcpManager;
  }

  /**
   * 获取Agent专属MCP管理器 (兼容性方法)
   * @deprecated 使用 getMcpManager() 替代
   */
  getAgentMcpManager(): MCPManager {
    return this.getMcpManager();
  }

  /**
   * 获取Agent专属MCP配置路径
   */
  getMCPConfigPath(): string {
    return this.mcpConfigPath;
  }

  /**
   * 检查Agent是否有MCP配置
   */
  async hasMCPConfig(): Promise<boolean> {
    return fs.existsSync(this.mcpConfigPath);
  }

  /**
   * 获取Agent专属MCP配置
   */
  async getMCPConfig(): Promise<WorkspaceMCPConfig | null> {
    if (!await this.hasMCPConfig()) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(this.mcpConfigPath, "utf-8");
      const config = JSON.parse(content) as WorkspaceMCPConfig;
      return config;
    } catch (error) {
      console.warn(`读取Agent MCP配置失败 ${this.config.name}:`, error);
      return null;
    }
  }

  /**
   * 更新Agent专属MCP配置
   */
  async updateMCPConfig(config: WorkspaceMCPConfig): Promise<boolean> {
    try {
      // 确保Agent目录存在
      if (!fs.existsSync(this.agentPath)) {
        await fs.promises.mkdir(this.agentPath, { recursive: true });
      }

      // 更新配置的基本信息
      const updatedConfig: WorkspaceMCPConfig = {
        ...config,
        workspacePath: this.agentPath,
      };

      const content = JSON.stringify(updatedConfig, null, 2);
      await fs.promises.writeFile(this.mcpConfigPath, content, "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存Agent MCP配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 删除Agent专属MCP配置
   */
  async deleteMCPConfig(): Promise<boolean> {
    try {
      if (await this.hasMCPConfig()) {
        await fs.promises.unlink(this.mcpConfigPath);
      }
      return true;
    } catch (error) {
      console.warn(`删除Agent MCP配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  // ==================== Agent专属MCP客户端管理 ====================


  /**
   * 启动Agent专属MCP客户端
   */
  async startMCPClients(): Promise<void> {

    await this.getMcpManager().startClients();
  }

  /**
   * 停止Agent专属MCP客户端
   */
  async stopMCPClients(): Promise<void> {

    await this.getMcpManager().stopClients();

  }

  /**
   * 获取Agent的MCP客户端列表
   */
  getMCPClients() {
    return this.getMcpManager().getAllClients();
  }


  /**
   * 获取Agent允许的MCP工具
   * 封装了过滤逻辑，返回Agent配置中允许的工具列表
   * 支持新的双层权限架构：allowMCPs (白名单) + blockMCPTools (黑名单)
   */
  getMCPTools(allowMCPs: string[] = this.getConfig().allowMCPs, blockMCPTools: string[] = this.getConfig().blockMCPTools): {
    allowedMCPsCount: number;
    availableTools: HyperChatCompletionTool[];
  } {
    const mcpClients = this.getMCPClients();


    // 获取所有可用工具
    const availableTools: HyperChatCompletionTool[] = [];
    mcpClients.forEach((client) => {
      if (allowMCPs.includes(client.serverName)) {
        client.tools.forEach(tool => {
          if (!blockMCPTools.includes(tool.displayName)) {
            availableTools.push(tool);
          }
        });
      }
    });

    return {
      allowedMCPsCount: allowMCPs.length,
      availableTools: availableTools,
    };
  }

  /**
   * 调用MCP工具
   * 替代废弃的Command.mcpCallToolWithWorkspace方法
   */
  async callTool(
    toolName: string,
    functionName: string,
    args: any = {},
    abortController?: AbortController
  ): Promise<any> {
    // 获取对应的MCP客户端
    const mcpClients = this.getMCPClients();
    const client = mcpClients.find((client: any) => client.serverName === toolName);

    if (!client) {
      throw new Error(`MCP client "${toolName}" not found in agent "${this.config.name}"`);
    }

    if (client.status !== 'connected') {
      throw new Error(`MCP client "${toolName}" is not connected (status: ${client.status})`);
    }

    try {
      // 调用MCP客户端的工具
      const result = await client.callTool(
        functionName,
        args,
        abortController
      );

      return result;
    } catch (error) {
      console.error(`Agent ${this.config.name} MCP工具调用失败 [${toolName}:${functionName}]:`, error);
      throw error;
    }
  }
}