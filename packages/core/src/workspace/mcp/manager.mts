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
  private localPath: string;
  private globalPath: string;
  private primaryPath: string;
  private serverOrderMap: Map<string, number> = new Map();

  constructor(localPath: string, globalPath?: string, options: MCPManagerOptions = {}, events: MCPManagerEvents = {}) {
    this.localPath = localPath;
    this.globalPath = globalPath || localPath;
    // 主路径是本地路径
    this.primaryPath = localPath;
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
    this.logInfo(`启动工作区 MCP 客户端: ${this.primaryPath}`);

    // 加载工作区配置
    const config = await this.loadWorkspaceConfig();

    // 初始化所有服务器的order，确保顺序稳定
    this.initializeServerOrders(config);

    const clients: WorkspaceMCPClientImpl[] = [];
    const tasks: Promise<void>[] = [];

    // 启动内置服务器
    const builtinServers = [...WorkSpaceServers];

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


      const clientId = this.getClientId(server.name, "workspace"); // 内置服务器始终是 workspace scope

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
          workspacePath: this.localPath,
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
      // 获取配置的 scope 信息
      const scope = (serverConfig as any)._scope || "workspace";
      const clientId = this.getClientId(name, scope);

      // 如果客户端已存在，跳过
      if (this.clients.has(clientId)) {
        clients.push(this.clients.get(clientId)!);
        continue;
      }
      // 移除内部属性
      const { _scope, ...cleanServerConfig } = serverConfig as any;

      const client = new WorkspaceMCPClientImpl(
        name,
        cleanServerConfig,
        scope,
        this.getServerOrder(name),
        {
          mcpType: "custom",
          workspacePath: this.localPath,
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

    this.logInfo(`工作区 ${this.primaryPath} 启动了 ${clients.length} 个客户端`);
    return clients;
  }

  /**
   * 启动单个指定名称的客户端
   */
  private async startSingleClient(name: string, serverConfig: MCPServerConfig): Promise<void> {
    // 获取配置的 scope 信息
    const scope = (serverConfig as any)._scope || "workspace";
    const clientId = this.getClientId(name, scope);

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
        workspacePath: this.localPath,
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
    const clientId = this.getClientId(name, "workspace"); // 内置服务器始终是 workspace scope

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
        workspacePath: this.localPath,
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
      const clientId = this.getClientId(client.serverName, client.scope);
      try {
        await client.close();
        this.clients.delete(clientId);
        this.logInfo(`客户端 ${clientId} 已停止`);
      } catch (error) {
        this.logError(`停止客户端 ${clientId} 失败:`, error);
      }
    });

    await Promise.allSettled(tasks);
    this.logInfo(`工作区 ${this.primaryPath} 停止了 ${clientsToStop.length} 个客户端`);
  }

  /**
   * 加载工作区配置（支持全局+工作区配置合并）
   */
  async loadWorkspaceConfig(): Promise<WorkspaceMCPConfig> {
    let workspaceConfig: WorkspaceMCPConfig = {
      mcpServers: {},
      workspacePath: this.localPath,
      created: Date.now(),
      lastModified: Date.now(),
    };

    // 先加载全局配置，再加载本地配置（本地覆盖全局）
    // 如果本地路径和全局路径相同，则只加载一次
    const paths = this.localPath === this.globalPath ? [this.localPath] : [this.globalPath, this.localPath];
    
    // 先合并所有配置
    const mergedServers: Record<string, MCPServerConfig & { _scope: "global" | "workspace" }> = {};
    
    for (let i = 0; i < paths.length; i++) {
      const workspacePath = paths[i];
      const configPath = path.join(workspacePath, CONSTANTS.CONFIG_FILES.MCP);
      const configName = i === 0 && paths.length > 1 ? "全局配置" : "本地配置";
      
      // 正确的 scope 判断逻辑：
      // 1. 如果 localPath 就是全局路径且 globalPath 为空，所有配置都是 workspace scope
      // 2. 如果有独立的 globalPath，则从 globalPath 加载的是 global scope
      const scope = (this.localPath !== this.globalPath && workspacePath === this.globalPath) ? "global" : "workspace";

      this.logInfo(`加载${configName}: ${configPath}`);
      
      if (fs.existsSync(configPath)) {
        try {
          const content = await fs.promises.readFile(configPath, "utf-8");
          const data = JSON.parse(content);
          const loadedServers = data.mcpServers || {};

          // 为每个服务器配置添加 scope 信息
          for (const [name, config] of Object.entries(loadedServers)) {
            mergedServers[name] = {
              ...(config as MCPServerConfig),
              _scope: scope
            };
          }

          this.logInfo(`从 ${configPath} 成功加载${configName}：${Object.keys(loadedServers).length} 个服务器`);
        } catch (error) {
          this.logError(`加载${configName}失败 (${configPath}):`, error);
        }
      } else if (i === 0 && paths.length === 1) {
        // 只有单一配置文件不存在时才创建默认配置文件
        await this.ensureDirectoryExists(path.dirname(configPath));
        await fs.promises.writeFile(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
        this.logInfo(`创建默认${configName}文件: ${configPath}`);
      } else {
        this.logInfo(`${configName}文件不存在，跳过: ${configPath}`);
      }
    }

    // 将合并后的服务器配置设置到工作区配置中
    workspaceConfig.mcpServers = mergedServers;

    this.logInfo(`配置合并完成，最终加载了 ${Object.keys(workspaceConfig.mcpServers).length} 个服务器配置`);

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
   * 获取工作区的客户端
   */
  getClientsByWorkspace(): WorkspaceMCPClientImpl[] {
    return this.getAllClients();
  }

  /**
   * 获取单个客户端
   */
  getClient(name: string, scope?: "global" | "workspace"): WorkspaceMCPClientImpl | null {
    const clientId = this.getClientId(name, scope);
    return this.clients.get(clientId) || null;
  }

  /**
   * 添加或更新服务器配置（不允许修改全局配置）
   */
  async setServerConfig(
    name: string,
    config: MCPServerConfig
  ): Promise<void> {
    if (!this.workspaceConfig) {
      this.workspaceConfig = await this.loadWorkspaceConfig();
    }

    // 检查是否是全局配置
    const existingConfig = this.workspaceConfig.mcpServers[name];
    if (existingConfig && (existingConfig as any)._scope === "global") {
      throw new Error(`不允许修改全局配置的服务器: ${name}`);
    }

    // 新增的配置默认为 workspace scope
    this.workspaceConfig.mcpServers[name] = {
      ...config,
      _scope: "workspace"
    } as any;
    this.workspaceConfig.lastModified = Date.now();

    // 保存配置
    await this.saveConfig();

    // 重启客户端
    await this.restartClient(name);

    this.events.onConfigUpdate?.(this.workspaceConfig);
  }

  /**
   * 删除服务器配置（不允许删除全局配置）
   */
  async deleteServerConfig(name: string): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    // 检查是否是全局配置
    const serverConfig = this.workspaceConfig.mcpServers[name];
    if (serverConfig && (serverConfig as any)._scope === "global") {
      throw new Error(`不允许删除全局配置的服务器: ${name}`);
    }

    delete this.workspaceConfig.mcpServers[name];
    this.workspaceConfig.lastModified = Date.now();

    // 保存配置
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
      this.logInfo(`开始重启客户端 ${name} (工作区: ${this.primaryPath})`);

      // 停止客户端
      await this.stopClient(name);

      // 先检查是否是内置客户端
      const builtinServers = [...WorkSpaceServers];
      const builtinServer = builtinServers.find(server => server.name === name);

      if (builtinServer) {
        // 内置客户端：根据服务器类型选择配置
        this.logInfo(`重启内置客户端 ${name}`);

        let serverConfig: MCPServerConfig;


        // WorkSpaceServers 中的服务器使用 inMemory 连接
        serverConfig = {
          type: "inMemory",
          disabled: false,
        };


        // 启动内置客户端
        await this.startSingleBuiltinClient(name, serverConfig);
      } else {
        // 自定义客户端：从配置文件中获取配置
        if (!this.workspaceConfig) {
          throw new Error(`工作区 ${this.localPath} 的配置不存在`);
        }

        if (!this.workspaceConfig.mcpServers[name]) {
          throw new Error(`客户端 ${name} 的配置不存在`);
        }

        // 只重启指定的客户端，而不是所有客户端
        await this.startSingleClient(name, this.workspaceConfig.mcpServers[name]);
      }

      this.logInfo(`客户端 ${name} 重启成功`);
    } catch (error) {
      this.logError(`客户端 ${name} 重启失败:`, error);

      // 通知错误事件
      const clientId = this.getClientId(name); // 这里使用默认 scope，因为只是错误报告
      this.events.onError?.(error as Error, {
        clientId,
        workspacePath: this.localPath,
        operation: 'restart'
      });

      throw error; // 重新抛出错误，让调用者知道重启失败
    }
  }

  /**
   * 停止单个客户端（全局客户端不允许停止，只允许重启）
   */
  async stopClient(name: string): Promise<void> {
    // 查找所有匹配名称的客户端（可能有多个scope）
    const clientsToStop = Array.from(this.clients.values()).filter(client => client.serverName === name);
    
    for (const client of clientsToStop) {
      // 全局客户端不允许停止
      if (client.scope === "global") {
        this.logInfo(`跳过全局客户端 ${client.serverName}，全局客户端不允许停止`);
        continue;
      }
      
      const clientId = this.getClientId(client.serverName, client.scope);
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
   * 保存配置（只保存工作区配置，不保存全局配置）
   */
  private async saveConfig(): Promise<void> {
    if (!this.workspaceConfig) {
      return;
    }

    const configPath = path.join(this.localPath, CONSTANTS.CONFIG_FILES.MCP);

    // 过滤掉全局配置，只保存工作区配置
    const workspaceServers: Record<string, MCPServerConfig> = {};
    for (const [name, config] of Object.entries(this.workspaceConfig.mcpServers)) {
      const serverConfig = config as any;
      if (serverConfig._scope !== "global") {
        // 移除内部属性再保存
        const { _scope, ...cleanConfig } = serverConfig;
        workspaceServers[name] = cleanConfig;
      }
    }

    try {
      await this.ensureDirectoryExists(path.dirname(configPath));
      await fs.promises.writeFile(
        configPath,
        JSON.stringify({ mcpServers: workspaceServers }, null, 2)
      );
      this.logInfo(`保存配置到 ${configPath}，共保存 ${Object.keys(workspaceServers).length} 个工作区服务器`);
    } catch (error) {
      this.logError(`保存配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取客户端ID
   */
  private getClientId(name: string, scope?: "global" | "workspace"): string {
    // 默认 scope 逻辑：
    // 1. 如果 localPath 就是全局路径且 globalPath 为空，默认是 workspace scope
    // 2. 如果有独立的 globalPath，则根据当前管理器的性质判断
    const actualScope = scope || "workspace";
    return `${actualScope}:${name}`;
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
    this.logInfo(`强制重新加载工作区配置: ${this.localPath}`);

    // 1. 停止该工作区的所有客户端
    await this.stopClients();

    // 2. 清除该工作区的配置缓存
    this.workspaceConfig = null;

    // 3. 重新加载并启动
    await this.startClients();

    this.logInfo(`工作区配置重新加载完成: ${this.localPath}`);
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