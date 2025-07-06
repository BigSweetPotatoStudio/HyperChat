/**
 * 工作区 MCP 管理器
 * 负责管理基于路径的 MCP 客户端
 */

import * as path from "path";
import * as fs from "fs";
import type { 
  WorkspaceMCPConfig, 
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
  private clients: Map<string, WorkspaceMCPClientImpl> = new Map();
  private configs: Map<string, WorkspaceMCPConfig> = new Map();
  private options: MCPManagerOptions;
  private events: MCPManagerEvents;
  private order: number = 0;

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
   * 启动指定工作区的 MCP 客户端
   */
  async startClients(workspacePath: string): Promise<WorkspaceMCPClientImpl[]> {
    this.logInfo(`启动工作区 MCP 客户端: ${workspacePath}`);

    // 加载工作区配置
    const config = await this.loadWorkspaceConfig(workspacePath);
    
    const clients: WorkspaceMCPClientImpl[] = [];
    const tasks: Promise<void>[] = [];

    // 启动内置服务器
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

      const clientId = this.getClientId(server.name, workspacePath);
      
      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }

      const client = new WorkspaceMCPClientImpl(
        server.name,
        serverConfig,
        "workspace",
        this.order++,
        {
          mcpType: "builtin",
          workspacePath,
        }
      );

      this.clients.set(clientId, client);
      clients.push(client);

      tasks.push(this.startClient(client, clientId));
    }

    // 启动用户配置的服务器
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      if (serverConfig.disabled) {
        continue;
      }

      const clientId = this.getClientId(name, workspacePath);
      
      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }

      const client = new WorkspaceMCPClientImpl(
        name,
        serverConfig,
        "workspace",
        this.order++,
        {
          mcpType: "custom",
          workspacePath,
        }
      );

      this.clients.set(clientId, client);
      clients.push(client);

      tasks.push(this.startClient(client, clientId));
    }

    // 等待所有客户端启动完成
    await Promise.allSettled(tasks);

    this.logInfo(`工作区 ${workspacePath} 启动了 ${clients.length} 个客户端`);
    return clients;
  }

  /**
   * 启动单个指定名称的客户端
   */
  private async startSingleClient(name: string, workspacePath: string, serverConfig: MCPServerConfig): Promise<void> {
    const clientId = this.getClientId(name, workspacePath);
    
    // 如果客户端已存在，先停止它
    if (this.clients.has(clientId)) {
      await this.stopClient(name, workspacePath);
    }
    
    // 创建新客户端
    const client = new WorkspaceMCPClientImpl(
      name,
      serverConfig,
      "workspace",
      this.order++,
      {
        mcpType: "custom",
        workspacePath,
      }
    );
    
    this.clients.set(clientId, client);
    
    // 启动客户端
    await this.startClient(client, clientId);
    
    this.logInfo(`单个客户端 ${clientId} 重启完成`);
  }

  /**
   * 启动单个内置客户端
   */
  private async startSingleBuiltinClient(name: string, workspacePath: string, serverConfig: MCPServerConfig): Promise<void> {
    const clientId = this.getClientId(name, workspacePath);
    
    // 如果客户端已存在，先停止它
    if (this.clients.has(clientId)) {
      await this.stopClient(name, workspacePath);
    }
    
    // 创建新的内置客户端
    const client = new WorkspaceMCPClientImpl(
      name,
      serverConfig,
      "workspace",
      this.order++,
      {
        mcpType: "builtin",
        workspacePath,
      }
    );
    
    this.clients.set(clientId, client);
    
    // 启动客户端
    await this.startClient(client, clientId);
    
    this.logInfo(`单个内置客户端 ${clientId} 重启完成`);
  }

  /**
   * 启动单个客户端
   */
  private async startClient(client: WorkspaceMCPClientImpl, clientId: string): Promise<void> {
    try {
      await client.open();
      this.logInfo(`客户端 ${clientId} 启动成功`);
      client.notifyStatusChange();
      this.events.onClientStatusChange?.(client);
    } catch (error) { 
      this.logError(`客户端 ${clientId} 启动失败:`, error);
      client.notifyStatusChange();
      this.events.onClientStatusChange?.(client);
      this.events.onError?.(error as Error, { clientId, workspacePath: client.workspacePath });
      throw error;
    }
  }

  /**
   * 停止指定工作区的 MCP 客户端
   */
  async stopClients(workspacePath: string): Promise<void> {
    const clientsToStop: WorkspaceMCPClientImpl[] = [];

    for (const [clientId, client] of this.clients) {
      if (client.workspacePath === workspacePath) {
        clientsToStop.push(client);
      }
    }

    const tasks = clientsToStop.map(async (client) => {
      const clientId = this.getClientId(client.name, client.workspacePath!);
      try {
        await client.close();
        this.clients.delete(clientId);
        this.logInfo(`客户端 ${clientId} 已停止`);
      } catch (error) {
        this.logError(`停止客户端 ${clientId} 失败:`, error);
      }
    });

    await Promise.allSettled(tasks);
    this.logInfo(`工作区 ${workspacePath} 停止了 ${clientsToStop.length} 个客户端`);
  }

  /**
   * 加载工作区配置
   */
  async loadWorkspaceConfig(workspacePath: string): Promise<WorkspaceMCPConfig> {
    let configPath: string;
    
    // 判断是否为全局工作区
    if (workspacePath === CONSTANTS.GLOBAL_PATH) {
      // 全局工作区使用特定的全局配置路径
      configPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
      this.logInfo(`使用全局配置路径: ${configPath}`);
    } else {
      // 普通工作区使用标准路径
      configPath = path.join(workspacePath, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
    }
    
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
    } else {
      // 创建默认配置文件
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
      this.logInfo(`创建默认配置文件: ${configPath}`);
    }

    this.configs.set(workspacePath, workspaceConfig);
    return workspaceConfig;
  }

  /**
   * 获取所有客户端
   */
  getAllClients(): WorkspaceMCPClientImpl[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取指定工作区的客户端
   */
  getClientsByWorkspace(workspacePath: string): WorkspaceMCPClientImpl[] {
    return this.getAllClients().filter(client => client.workspacePath === workspacePath);
  }

  /**
   * 获取单个客户端
   */
  getClient(name: string, workspacePath: string): WorkspaceMCPClientImpl | null {
    const clientId = this.getClientId(name, workspacePath);
    return this.clients.get(clientId) || null;
  }

  /**
   * 添加或更新服务器配置
   */
  async setServerConfig(
    name: string, 
    config: MCPServerConfig, 
    workspacePath: string
  ): Promise<void> {
    let mcpConfig = this.configs.get(workspacePath);

    if (!mcpConfig) {
      mcpConfig = await this.loadWorkspaceConfig(workspacePath);
    }

    mcpConfig.mcpServers[name] = config;
    mcpConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig(workspacePath);

    // 重启客户端
    await this.restartClient(name, workspacePath);

    this.events.onConfigUpdate?.(mcpConfig);
  }

  /**
   * 删除服务器配置
   */
  async deleteServerConfig(name: string, workspacePath: string): Promise<void> {
    const mcpConfig = this.configs.get(workspacePath);

    if (!mcpConfig) {
      return;
    }

    delete mcpConfig.mcpServers[name];
    mcpConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig(workspacePath);

    // 停止客户端
    await this.stopClient(name, workspacePath);

    this.events.onConfigUpdate?.(mcpConfig);
  }

  /**
   * 重启客户端
   */
  async restartClient(name: string, workspacePath: string): Promise<void> {
    try {
      this.logInfo(`开始重启客户端 ${name} (工作区: ${workspacePath})`);
      
      // 停止客户端
      await this.stopClient(name, workspacePath);
      
      // 先检查是否是内置客户端
      const builtinServer = MyServers.find(server => server.name === name);
      
      if (builtinServer) {
        // 内置客户端：从 MyServers 获取配置
        this.logInfo(`重启内置客户端 ${name}`);
        const serverConfig: MCPServerConfig = {
          type: builtinServer.type === "streamableHttp" ? "streamableHttp" : "sse",
          url: builtinServer.type === "streamableHttp" 
            ? `http://localhost:${Config.mcp_server_port}/${builtinServer.name}/mcp`
            : `http://localhost:${Config.mcp_server_port}/${builtinServer.name}/sse`,
          hyperchat: {
            scope: "built-in",
            config: {},
          } as any,
          disabled: false,
        };
        
        // 启动内置客户端
        await this.startSingleBuiltinClient(name, workspacePath, serverConfig);
      } else {
        // 自定义客户端：从配置文件中获取配置
        const config = this.configs.get(workspacePath);
        
        if (!config) {
          throw new Error(`工作区 ${workspacePath} 的配置不存在`);
        }
        
        if (!config.mcpServers[name]) {
          throw new Error(`客户端 ${name} 的配置不存在`);
        }
        
        // 只重启指定的客户端，而不是所有客户端
        await this.startSingleClient(name, workspacePath, config.mcpServers[name]);
      }
      
      this.logInfo(`客户端 ${name} 重启成功`);
    } catch (error) {
      this.logError(`客户端 ${name} 重启失败:`, error);
      
      // 通知错误事件
      const clientId = this.getClientId(name, workspacePath);
      this.events.onError?.(error as Error, { 
        clientId, 
        workspacePath, 
        operation: 'restart' 
      });
      
      throw error; // 重新抛出错误，让调用者知道重启失败
    }
  }

  /**
   * 停止单个客户端
   */
  async stopClient(name: string, workspacePath: string): Promise<void> {
    const clientId = this.getClientId(name, workspacePath);
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
  private async saveConfig(workspacePath: string): Promise<void> {
    const config = this.configs.get(workspacePath);

    if (!config) {
      return;
    }

    let configPath: string;
    
    // 判断是否为全局工作区
    if (workspacePath === CONSTANTS.GLOBAL_PATH) {
      // 全局工作区使用特定的全局配置路径
      configPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
    } else {
      // 普通工作区使用标准路径
      configPath = path.join(workspacePath, CONSTANTS.HYPERCHAT_DIR, CONSTANTS.CONFIG_FILES.MCP);
    }

    try {
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(
        configPath, 
        JSON.stringify({ mcpServers: config.mcpServers }, null, 2)
      );
      this.logInfo(`保存配置到 ${configPath}`);
    } catch (error) {
      this.logError(`保存配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取客户端ID
   */
  private getClientId(name: string, workspacePath: string): string {
    return `${workspacePath}:${name}`;
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
   * 强制重新加载工作区配置
   */
  async forceReloadWorkspaceConfig(workspacePath: string): Promise<void> {
    this.logInfo(`强制重新加载工作区配置: ${workspacePath}`);
    
    // 1. 停止该工作区的所有客户端
    await this.stopClients(workspacePath);
    
    // 2. 清除该工作区的配置缓存
    this.configs.delete(workspacePath);
    
    // 3. 重新加载并启动
    await this.startClients(workspacePath);
    
    this.logInfo(`工作区配置重新加载完成: ${workspacePath}`);
  }

  /**
   * 停止所有客户端
   */
  async stopAllClients(): Promise<void> {
    this.logInfo("正在停止所有MCP客户端...");
    const tasks = Array.from(this.clients.values()).map(client => client.close());
    await Promise.allSettled(tasks);
    this.clients.clear();
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
    
    this.logInfo("工作区 MCP 管理器已销毁");
  }
}