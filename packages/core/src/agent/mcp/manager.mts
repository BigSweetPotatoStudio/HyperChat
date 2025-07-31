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
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import { Logger } from "../../log.mjs";
import { CONSTANTS } from "../constants.mjs";
import { WorkSpaceServers } from "../../mcp/servers/index.mjs";

export class WorkspaceMCPManager {
  private clients: Map<string, WorkspaceMCPClientImpl> = new Map();
  private workspaceConfig: WorkspaceMCPConfig | null = null;
  private options: MCPManagerOptions;
  private events: MCPManagerEvents;
  private workspacePath: string;
  private serverOrderMap: Map<string, number> = new Map();

  constructor(workspacePath: string, options: MCPManagerOptions = {}, events: MCPManagerEvents = {}) {
    this.workspacePath = workspacePath;
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
   * 初始化所有服务器的order，确保顺序稳定
   */
  private initializeServerOrders(config: WorkspaceMCPConfig): void {
    // 清空现有的order映射
    this.serverOrderMap.clear();

    let orderIndex = 0;

    // 首先为内置服务器分配order（按名称排序确保稳定性）
    // WorkSpaceServers
    const builtinServers = [...WorkSpaceServers];
    const sortedBuiltinServers = [...builtinServers];
    for (const server of sortedBuiltinServers) {
      this.serverOrderMap.set(server.name, orderIndex++);
    }

    // 然后为自定义服务器分配order（按名称排序确保稳定性）
    const sortedCustomServers = Object.keys(config.mcpServers).sort();
    for (const serverName of sortedCustomServers) {
      if (!this.serverOrderMap.has(serverName)) {
        this.serverOrderMap.set(serverName, orderIndex++);
      }
    }
  }

  /**
   * 获取服务器的稳定order，如果不存在则分配新的order
   */
  private getServerOrder(serverName: string): number {
    if (!this.serverOrderMap.has(serverName)) {
      // 为新服务器分配order，基于当前已有的服务器数量
      const nextOrder = this.serverOrderMap.size;
      this.serverOrderMap.set(serverName, nextOrder);
    }
    return this.serverOrderMap.get(serverName)!;
  }

  /**
   * 启动工作区的 MCP 客户端
   */
  async startClients(): Promise<WorkspaceMCPClientImpl[]> {
    this.logInfo(`启动工作区 MCP 客户端: ${this.workspacePath}`);

    // 加载工作区配置
    const config = await this.loadWorkspaceConfig();

    // 初始化所有服务器的order，确保顺序稳定
    this.initializeServerOrders(config);

    const clients: WorkspaceMCPClientImpl[] = [];
    const tasks: Promise<void>[] = [];

    // 启动内置服务器
    const builtinServers = [...WorkSpaceServers];
    this.logInfo(`准备启动 ${builtinServers.length} 个内置服务器`);

    for (const server of builtinServers) {
      // 检查配置文件中是否有对内置服务器的disabled设置
      const userServerConfig = config.mcpServers[server.name];
      const isDisabled = userServerConfig?.disabled || false;

      let serverConfig: MCPServerConfig;

      // WorkSpaceServers 中的服务器使用 inMemory 连接
      serverConfig = {
        type: "inMemory",
        disabled: false,
      };


      const clientId = this.getClientId(server.name);

      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }
      const client = new WorkspaceMCPClientImpl(
        server.name,
        serverConfig,
        "workspace",
        this.getServerOrder(server.name),
        {
          mcpType: "builtin",
          workspacePath: this.workspacePath,
          globalPath: this.workspacePath,
          createServer: server.createServer
        }
      );

      this.clients.set(clientId, client);
      clients.push(client);

      // 只有非禁用的客户端才启动连接
      if (!isDisabled) {
        tasks.push(this.startClient(client, clientId));
      } else {
        // 禁用的客户端设置为disabled状态
        client.status = "disabled";
      }
    }


    // 启动用户配置的服务器
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const clientId = this.getClientId(name);

      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }

      const client = new WorkspaceMCPClientImpl(
        name,
        serverConfig,
        "workspace", // 工作区级别的MCP客户端都是workspace scope
        this.getServerOrder(name),
        {
          mcpType: "custom",
          workspacePath: this.workspacePath,
          globalPath: this.workspacePath,
        }
      );

      this.clients.set(clientId, client);
      clients.push(client);

      // 只有非禁用的客户端才启动连接
      if (!serverConfig.disabled) {
        tasks.push(this.startClient(client, clientId));
      } else {
        // 禁用的客户端设置为disabled状态
        client.status = "disabled";
      }
    }

    // 等待所有客户端启动完成
    await Promise.allSettled(tasks);

    this.logInfo(`工作区 ${this.workspacePath} 启动了 ${clients.length} 个客户端`);
    return clients;
  }

  /**
   * 启动单个指定名称的客户端
   */
  private async startSingleClient(name: string, serverConfig: MCPServerConfig): Promise<void> {
    // 获取配置的 scope 信息
    const scope = (serverConfig as any)._scope || "workspace";
    const clientId = this.getClientId(name);

    // 如果客户端已存在，先停止它
    if (this.clients.has(clientId)) {
      await this.stopClient(name);
    }
    // 移除内部属性
    const { _scope, ...cleanServerConfig } = serverConfig as any;

    // 创建新客户端
    const client = new WorkspaceMCPClientImpl(
      name,
      cleanServerConfig,
      scope,
      this.getServerOrder(name),
      {
        mcpType: "custom",
        workspacePath: this.workspacePath,
        globalPath: this.workspacePath,
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
  private async startSingleBuiltinClient(name: string, serverConfig: MCPServerConfig): Promise<void> {
    const clientId = this.getClientId(name);

    // 如果客户端已存在，先停止它
    if (this.clients.has(clientId)) {
      await this.stopClient(name);
    }

    // 获取服务器配置
    const builtinServers = [...WorkSpaceServers];
    const builtinServer = builtinServers.find(server => server.name === name);

    // 创建新的内置客户端
    const client = new WorkspaceMCPClientImpl(
      name,
      serverConfig,
      "workspace", // 内置服务器始终是 workspace scope
      this.getServerOrder(name),
      {
        mcpType: "builtin",
        workspacePath: this.workspacePath,
        globalPath: this.workspacePath,
        createServer: builtinServer?.createServer
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
   * 停止工作区的所有 MCP 客户端
   */
  async stopClients(): Promise<void> {
    const clientsToStop = Array.from(this.clients.values());

    const tasks = clientsToStop.map(async (client) => {
      const clientId = this.getClientId(client.serverName);
      try {
        await client.close();
        this.clients.delete(clientId);
        this.logInfo(`客户端 ${clientId} 已停止`);
      } catch (error) {
        this.logError(`停止客户端 ${clientId} 失败:`, error);
      }
    });

    await Promise.allSettled(tasks);
    this.logInfo(`工作区 ${this.workspacePath} 停止了 ${clientsToStop.length} 个客户端`);
  }

  /**
   * 加载工作区配置（简化版 - 只加载当前工作区的配置）
   */
  async loadWorkspaceConfig(): Promise<WorkspaceMCPConfig> {
    let workspaceConfig: WorkspaceMCPConfig = {
      mcpServers: {},
      workspacePath: this.workspacePath,
      created: Date.now(),
      lastModified: Date.now(),
    };

    // 只加载当前工作区的配置文件
    const configPath = path.join(this.workspacePath, CONSTANTS.CONFIG_FILES.MCP);
    this.logInfo(`加载工作区配置: ${configPath}`);

    if (fs.existsSync(configPath)) {
      try {
        const content = await fs.promises.readFile(configPath, "utf-8");
        const data = JSON.parse(content);
        const loadedServers = data.mcpServers || {};

        // 直接使用加载的服务器配置，不添加scope信息
        workspaceConfig.mcpServers = loadedServers;

        this.logInfo(`从 ${configPath} 成功加载工作区配置：${Object.keys(loadedServers).length} 个服务器`);
      } catch (error) {
        this.logError(`加载工作区配置失败 (${configPath}):`, error);
      }
    } else {
      this.logInfo(`工作区配置文件不存在，使用默认配置: ${configPath}`);
    }

    this.logInfo(`工作区配置加载完成，共加载了 ${Object.keys(workspaceConfig.mcpServers).length} 个服务器配置`);

    this.workspaceConfig = workspaceConfig;
    return workspaceConfig;
  }


  /**
   * 获取所有客户端
   */
  getAllClients(): WorkspaceMCPClientImpl[] {
    return Array.from(this.clients.values());
  }



  /**
   * 获取单个客户端
   */
  getClient(name: string): WorkspaceMCPClientImpl | null {
    const clientId = this.getClientId(name);
    return this.clients.get(clientId) || null;
  }

  /**
   * 添加或更新工作区服务器配置
   */
  async setServerConfig(
    name: string,
    config: MCPServerConfig
  ): Promise<void> {
    if (!this.workspaceConfig) {
      this.workspaceConfig = await this.loadWorkspaceConfig();
    }

    // 直接设置工作区配置
    this.workspaceConfig.mcpServers[name] = config;
    this.workspaceConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig();

    // 重启客户端
    await this.restartClient(name);

    this.events.onConfigUpdate?.(this.workspaceConfig);
  }

  /**
   * 删除服务器配置
   */
  async deleteServerConfig(name: string): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    const serverConfig = this.workspaceConfig.mcpServers[name];
    if (!serverConfig) {
      throw new Error(`工作区配置中不存在服务器: ${name}`);
    }

    delete this.workspaceConfig.mcpServers[name];
    this.workspaceConfig.lastModified = Date.now();

    // 保存工作区配置
    await this.saveConfig();

    // 停止客户端
    await this.stopClient(name);

    this.events.onConfigUpdate?.(this.workspaceConfig);
  }



  /**
   * 重启客户端
   */
  async restartClient(name: string): Promise<void> {
    try {
      this.logInfo(`开始重启客户端 ${name} (工作区: ${this.workspacePath})`);

      // 停止客户端
      await this.stopClient(name);

      // 先检查是否是内置客户端
      const builtinServers = [...WorkSpaceServers];
      const builtinServer = builtinServers.find(server => server.name === name);

      if (builtinServer) {
        // 内置客户端：使用 inMemory 连接
        this.logInfo(`重启内置客户端 ${name}`);

        const serverConfig: MCPServerConfig = {
          type: "inMemory",
          disabled: false,
        };

        // 启动内置客户端
        await this.startSingleBuiltinClient(name, serverConfig);
      } else {
        // 自定义客户端：从配置文件中获取配置
        if (!this.workspaceConfig) {
          throw new Error(`工作区 ${this.workspacePath} 的配置不存在`);
        }

        const serverConfig = this.workspaceConfig.mcpServers[name];
        if (!serverConfig) {
          throw new Error(`客户端 ${name} 的配置不存在`);
        }

        // 重启指定的客户端
        await this.startSingleClient(name, serverConfig);
      }

      this.logInfo(`客户端 ${name} 重启成功`);
    } catch (error) {
      this.logError(`客户端 ${name} 重启失败:`, error);

      // 通知错误事件
      const clientId = this.getClientId(name);
      this.events.onError?.(error as Error, {
        clientId,
        workspacePath: this.workspacePath,
        operation: 'restart'
      });

      throw error; // 重新抛出错误，让调用者知道重启失败
    }
  }

  /**
   * 停止单个客户端
   */
  async stopClient(name: string): Promise<void> {
    const clientId = this.getClientId(name);
    const client = this.clients.get(clientId);
    
    if (!client) {
      this.logInfo(`客户端 ${clientId} 不存在，跳过停止操作`);
      return;
    }

    try {
      await client.close();
      this.clients.delete(clientId);
      this.logInfo(`客户端 ${clientId} 已停止`);
    } catch (error) {
      this.logError(`停止客户端 ${clientId} 失败:`, error);
    }
  }

  /**
   * 禁用客户端（停止客户端并在配置中标记为 disabled）
   */
  async disableClient(name: string): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    // 检查是否为内置客户端，内置客户端不允许禁用
    const builtinServers = [...WorkSpaceServers];
    const isBuiltinServer = builtinServers.find(server => server.name === name);
    if (isBuiltinServer) {
      throw new Error(`内置客户端 ${name} 不允许禁用`);
    }

    const serverConfig = this.workspaceConfig.mcpServers[name];
    if (!serverConfig) {
      throw new Error(`客户端 ${name} 的配置不存在`);
    }

    // 先停止客户端
    await this.stopClient(name);

    // 在配置中标记为 disabled
    serverConfig.disabled = true;
    this.workspaceConfig.lastModified = Date.now();

    // 保存配置文件
    await this.saveConfig();

    this.logInfo(`客户端 ${name} 已禁用`);
    this.events.onConfigUpdate?.(this.workspaceConfig);
  }

  /**
   * 启用客户端（删除配置中的 disabled 属性并启动客户端）
   */
  async enableClient(name: string): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    // 检查是否为内置客户端，内置客户端不需要启用操作（它们默认启用）
    const builtinServers = [...WorkSpaceServers];
    const isBuiltinServer = builtinServers.find(server => server.name === name);
    if (isBuiltinServer) {
      throw new Error(`内置客户端 ${name} 默认启用，无需手动启用`);
    }

    const serverConfig = this.workspaceConfig.mcpServers[name];
    if (!serverConfig) {
      throw new Error(`客户端 ${name} 的配置不存在`);
    }

    // 在配置中删除 disabled 属性（与 disable 操作相反）
    delete serverConfig.disabled;
    this.workspaceConfig.lastModified = Date.now();

    // 保存配置文件
    await this.saveConfig();

    // 启动客户端
    await this.restartClient(name);

    this.logInfo(`客户端 ${name} 已启用`);
    this.events.onConfigUpdate?.(this.workspaceConfig);
  }

  /**
   * 保存工作区配置
   */
  private async saveConfig(): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    const configPath = path.join(this.workspacePath, CONSTANTS.CONFIG_FILES.MCP);

    try {
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(
        configPath,
        JSON.stringify({ mcpServers: this.workspaceConfig.mcpServers }, null, 2)
      );
      this.logInfo(`保存配置到 ${configPath}，共保存 ${Object.keys(this.workspaceConfig.mcpServers).length} 个服务器`);
    } catch (error) {
      this.logError(`保存配置失败:`, error);
      throw error;
    }
  }


  /**
   * 获取客户端ID
   */
  private getClientId(name: string): string {
    // 工作区级别的MCP管理器，客户端ID就是名称
    return name;
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
  async forceReloadWorkspaceConfig(): Promise<void> {
    this.logInfo(`强制重新加载工作区配置: ${this.workspacePath}`);

    // 1. 停止该工作区的所有客户端
    await this.stopClients();

    // 2. 清除该工作区的配置缓存
    this.workspaceConfig = null;

    // 3. 重新加载并启动
    await this.startClients();

    this.logInfo(`工作区配置重新加载完成: ${this.workspacePath}`);
  }

  /**
   * 停止所有客户端 (别名方法，与 stopClients 功能相同)
   */
  async stopAllClients(): Promise<void> {
    await this.stopClients();
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    this.logInfo("正在销毁工作区 MCP 管理器...");

    await this.stopClients();
    this.workspaceConfig = null;

    this.logInfo("工作区 MCP 管理器已销毁");
  }
}