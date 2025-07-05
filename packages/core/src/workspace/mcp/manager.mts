/**
 * 工作区 MCP 管理器
 * 负责管理全局和工作区的 MCP 客户端
 */

import * as path from "path";
import * as fs from "fs";
import type { 
  WorkspaceMCPConfig, 
  WorkspaceMCPClient, 
  MCPScope, 
  MCPManagerOptions, 
  MCPManagerEvents 
} from "./types.mjs";
import { WorkspaceMCPClientImpl } from "./client.mjs";
import type { MCPServerConfig } from "../../shared/data.mjs";
import { Logger } from "../../log.mjs";
import { CONSTANTS } from "../constants.mjs";
import { MyServers } from "../../mcp/servers/index.mjs";
import { Config } from "../../const.mjs";

export class WorkspaceMCPManager {
  private clients: Map<string, WorkspaceMCPClient> = new Map();
  private configs: Map<string, WorkspaceMCPConfig> = new Map();
  private options: MCPManagerOptions;
  private events: MCPManagerEvents;
  private order: number = 0;
  private initialized: boolean = false;

  constructor(options: MCPManagerOptions = {}, events: MCPManagerEvents = {}) {
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      enableLogging: true,
      ...options,
    };
    this.events = events;
  }

  /**
   * 初始化 MCP 管理器
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logInfo("正在初始化工作区 MCP 管理器...");

    try {
      // 1. 加载内置服务器配置
      await this.loadBuiltinServers();

      // 2. 加载全局配置
      await this.loadGlobalConfig();

      this.initialized = true;
      this.logInfo("工作区 MCP 管理器初始化完成");
    } catch (error) {
      this.logError("初始化工作区 MCP 管理器失败:", error);
      throw error;
    }
  }

  /**
   * 加载内置服务器配置到全局范围
   */
  private async loadBuiltinServers(): Promise<void> {
    // 内置服务器加载到全局范围，但标记为 builtin 类型
    const globalConfig = this.configs.get("global") || {
      mcpServers: {},
      scope: "global" as MCPScope,
      autoStart: true,
      created: Date.now(),
      lastModified: Date.now(),
    };

    // 构建内置服务器配置
    for (const server of MyServers) {
      const serverConfig: MCPServerConfig = {
        type: server.type === "streamableHttp" ? "streamableHttp" : "sse",
        url: server.type === "streamableHttp" 
          ? `http://localhost:${Config.mcp_server_port}/${server.name}/mcp`
          : `http://localhost:${Config.mcp_server_port}/${server.name}/sse`,
        hyperchat: {
          scope: "built-in",
          config: {},
        } as any,
        disabled: false,
      };

      // 内置服务器也存储在全局配置中，但会用不同的 mcpType 标识
      globalConfig.mcpServers[server.name] = serverConfig;
    }

    this.configs.set("global", globalConfig);
    this.logInfo(`加载了 ${MyServers.length} 个内置服务器到全局范围`);
  }

  /**
   * 加载全局配置
   */
  private async loadGlobalConfig(): Promise<void> {
    const globalPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.CONFIG_FILES.MCP);
    
    let globalConfig: WorkspaceMCPConfig = {
      mcpServers: {},
      scope: "global",
      autoStart: true,
      created: Date.now(),
      lastModified: Date.now(),
    };

    if (fs.existsSync(globalPath)) {
      try {
        const content = await fs.promises.readFile(globalPath, "utf-8");
        const data = JSON.parse(content);
        globalConfig.mcpServers = data.mcpServers || {};
        this.logInfo(`从全局配置加载了 ${Object.keys(globalConfig.mcpServers).length} 个服务器`);
      } catch (error) {
        this.logError("加载全局 MCP 配置失败:", error);
      }
    } else {
      // 创建默认的全局配置文件
      await this.ensureDirectoryExists(path.dirname(globalPath));
      await fs.promises.writeFile(globalPath, JSON.stringify({ mcpServers: {} }, null, 2));
      this.logInfo("创建了默认的全局 MCP 配置文件");
    }

    this.configs.set("global", globalConfig);
  }

  /**
   * 加载工作区配置
   */
  async loadWorkspaceConfig(workspacePath: string): Promise<WorkspaceMCPConfig> {
    const configPath = path.join(workspacePath, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
    
    let workspaceConfig: WorkspaceMCPConfig = {
      mcpServers: {},
      scope: "workspace",
      workspacePath,
      autoStart: true,
      created: Date.now(),
      lastModified: Date.now(),
    };

    if (fs.existsSync(configPath)) {
      try {
        const content = await fs.promises.readFile(configPath, "utf-8");
        const data = JSON.parse(content);
        workspaceConfig.mcpServers = data.mcpServers || {};
        workspaceConfig.workspacePath = workspacePath;
        this.logInfo(`从工作区 ${workspacePath} 加载了 ${Object.keys(workspaceConfig.mcpServers).length} 个服务器`);
      } catch (error) {
        this.logError(`加载工作区 ${workspacePath} MCP 配置失败:`, error);
      }
    }

    const configKey = `workspace:${workspacePath}`;
    this.configs.set(configKey, workspaceConfig);
    return workspaceConfig;
  }

  /**
   * 启动指定范围的 MCP 客户端
   */
  async startClients(scope: MCPScope, workspacePath?: string): Promise<WorkspaceMCPClient[]> {
    const configKey = scope === "workspace" ? `workspace:${workspacePath}` : scope;
    const config = this.configs.get(configKey);
    
    if (!config) {
      throw new Error(`未找到 ${scope} 范围的配置`);
    }

    const clients: WorkspaceMCPClient[] = [];
    const tasks: Promise<void>[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      if (serverConfig.disabled) {
        continue;
      }

      const clientId = this.getClientId(name, scope, workspacePath);
      
      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }

      // 判断是否为内置服务器
      const isBuiltinServer = MyServers.some(s => s.name === name);
      const mcpType = isBuiltinServer ? "builtin" : "custom";

      const client = new WorkspaceMCPClientImpl(
        name,
        serverConfig,
        scope,
        this.order++,
        {
          mcpType,
          workspacePath,
          dynamic: true,
          priority: this.getScopePriority(scope),
        }
      );

      this.clients.set(clientId, client);
      clients.push(client);

      // 异步启动客户端
      tasks.push(
        client.open()
          .then(() => {
            this.logInfo(`客户端 ${clientId} 启动成功`);
            client.notifyStatusChange();
            this.events.onClientStatusChange?.(client);
          })
          .catch((error) => {
            this.logError(`客户端 ${clientId} 启动失败:`, error);
            client.notifyStatusChange();
            this.events.onClientStatusChange?.(client);
            this.events.onError?.(error, { clientId, scope, workspacePath });
          })
      );
    }

    // 等待所有客户端启动完成
    await Promise.allSettled(tasks);

    this.logInfo(`${scope} 范围启动了 ${clients.length} 个客户端`);
    return clients;
  }

  /**
   * 停止指定范围的 MCP 客户端
   */
  async stopClients(scope: MCPScope, workspacePath?: string): Promise<void> {
    const clientsToStop: WorkspaceMCPClient[] = [];

    for (const [clientId, client] of this.clients) {
      if (client.scope === scope && 
          (scope !== "workspace" || client.workspacePath === workspacePath)) {
        clientsToStop.push(client);
      }
    }

    const tasks = clientsToStop.map(async (client) => {
      const clientId = this.getClientId(client.name, client.scope, client.workspacePath);
      try {
        await client.close();
        this.clients.delete(clientId);
        this.logInfo(`客户端 ${clientId} 已停止`);
      } catch (error) {
        this.logError(`停止客户端 ${clientId} 失败:`, error);
      }
    });

    await Promise.allSettled(tasks);
    this.logInfo(`${scope} 范围停止了 ${clientsToStop.length} 个客户端`);
  }

  /**
   * 获取所有客户端
   */
  getAllClients(): WorkspaceMCPClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取指定范围的客户端
   */
  getClientsByScope(scope: MCPScope, workspacePath?: string): WorkspaceMCPClient[] {
    return this.getAllClients().filter(client => 
      client.scope === scope && 
      (scope !== "workspace" || client.workspacePath === workspacePath)
    );
  }

  /**
   * 获取单个客户端
   */
  getClient(name: string, scope: MCPScope, workspacePath?: string): WorkspaceMCPClient | null {
    const clientId = this.getClientId(name, scope, workspacePath);
    return this.clients.get(clientId) || null;
  }

  /**
   * 添加或更新服务器配置
   */
  async setServerConfig(
    name: string, 
    config: MCPServerConfig, 
    scope: MCPScope, 
    workspacePath?: string
  ): Promise<void> {
    const configKey = scope === "workspace" ? `workspace:${workspacePath}` : scope;
    let mcpConfig = this.configs.get(configKey);

    if (!mcpConfig) {
      if (scope === "workspace") {
        mcpConfig = await this.loadWorkspaceConfig(workspacePath!);
      } else {
        throw new Error(`未找到 ${scope} 范围的配置`);
      }
    }

    mcpConfig.mcpServers[name] = config;
    mcpConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig(scope, workspacePath);

    // 重启客户端
    await this.restartClient(name, scope, workspacePath);

    this.events.onConfigUpdate?.(mcpConfig);
  }

  /**
   * 删除服务器配置
   */
  async deleteServerConfig(name: string, scope: MCPScope, workspacePath?: string): Promise<void> {
    const configKey = scope === "workspace" ? `workspace:${workspacePath}` : scope;
    const mcpConfig = this.configs.get(configKey);

    if (!mcpConfig) {
      return;
    }

    delete mcpConfig.mcpServers[name];
    mcpConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig(scope, workspacePath);

    // 停止客户端
    await this.stopClient(name, scope, workspacePath);

    this.events.onConfigUpdate?.(mcpConfig);
  }

  /**
   * 重启客户端
   */
  async restartClient(name: string, scope: MCPScope, workspacePath?: string): Promise<void> {
    await this.stopClient(name, scope, workspacePath);
    
    const configKey = scope === "workspace" ? `workspace:${workspacePath}` : scope;
    const config = this.configs.get(configKey);
    
    if (config && config.mcpServers[name]) {
      await this.startClients(scope, workspacePath);
    }
  }

  /**
   * 停止单个客户端
   */
  async stopClient(name: string, scope: MCPScope, workspacePath?: string): Promise<void> {
    const clientId = this.getClientId(name, scope, workspacePath);
    const client = this.clients.get(clientId);

    if (client) {
      try {
        await client.close();
        this.clients.delete(clientId);
        this.logInfo(`客户端 ${clientId} 已停止`);
      } catch (error) {
        this.logError(`停止客户端 ${clientId} 失败:`, error);
      }
    }
  }

  /**
   * 保存配置
   */
  private async saveConfig(scope: MCPScope, workspacePath?: string): Promise<void> {
    const configKey = scope === "workspace" ? `workspace:${workspacePath}` : scope;
    const config = this.configs.get(configKey);

    if (!config) {
      return;
    }

    let configPath: string;
    
    switch (scope) {
      case "global":
        configPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.CONFIG_FILES.MCP);
        break;
      case "workspace":
        configPath = path.join(workspacePath!, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
        break;
      default:
        return; // 内置配置不需要保存
    }

    try {
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(
        configPath, 
        JSON.stringify({ mcpServers: config.mcpServers }, null, 2)
      );
      this.logInfo(`保存 ${scope} 配置到 ${configPath}`);
    } catch (error) {
      this.logError(`保存 ${scope} 配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取客户端ID
   */
  private getClientId(name: string, scope: MCPScope, workspacePath?: string): string {
    return workspacePath ? `${scope}:${workspacePath}:${name}` : `${scope}:${name}`;
  }

  /**
   * 获取范围优先级
   */
  private getScopePriority(scope: MCPScope): number {
    switch (scope) {
      case "global": return 1;
      case "workspace": return 2;
      default: return 999;
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 记录信息日志
   */
  private logInfo(message: string, ...args: any[]): void {
    if (this.options.enableLogging) {
      Logger.info(`[WorkspaceMCPManager] ${message}`, ...args);
    }
  }

  /**
   * 记录错误日志
   */
  private logError(message: string, ...args: any[]): void {
    if (this.options.enableLogging) {
      Logger.error(`[WorkspaceMCPManager] ${message}`, ...args);
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logInfo("正在销毁工作区 MCP 管理器...");
    
    const tasks = Array.from(this.clients.values()).map(client => client.close());
    await Promise.allSettled(tasks);
    
    this.clients.clear();
    this.configs.clear();
    this.initialized = false;
    
    this.logInfo("工作区 MCP 管理器已销毁");
  }
}