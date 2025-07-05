/**
 * 工作区 MCP 客户端实现
 * 直接实现 WorkspaceMCPClient 接口，不继承原有的 MCPClient
 */

import * as MCP from "@modelcontextprotocol/sdk/client/index.js";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { 
  SSEClientTransport, 
  StreamableHTTPClientTransport,
  StdioClientTransport 
} from "../../es6.mjs";
import { 
  CallToolResultSchema,
  CompatibilityCallToolResultSchema,
  ResourceListChangedNotificationSchema 
} from "../../es6.mjs";
import type { MCPServerConfig, HyperChatCompletionTool } from "../../shared/data.mjs";
import type { WorkspaceMCPClient, MCPScope, MCPType } from "./types.mjs";
import { Logger } from "../../log.mjs";
import { getMessageService } from "../../message_service.mjs";
import { AppSetting } from "../../shared/data.mjs";
import { getMyDefaultEnvironment } from "../../mcp/utils.mjs";
import { MyServers } from "../../mcp/servers/index.mjs";
import { zodToJsonSchema } from "zod-to-json-schema";
import spawn from "cross-spawn";
import { zx } from "../../es6.mjs";
const { os, sleep } = zx;

// 常量定义
const DEFAULT_RECONNECT_DELAY = 5000; // 5秒
const MAX_RECONNECT_DELAY = 30000; // 最大30秒
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BACKOFF_FACTOR = 1.5;

export class WorkspaceMCPClientImpl implements WorkspaceMCPClient {
  public tools: Array<HyperChatCompletionTool> = [];
  public resources: any[] = [];
  public prompts: any[] = [];
  public client: MCP.Client | undefined = undefined;
  public status: WorkspaceMCPClient["status"] = "disconnected";
  public version = "";
  public servername = "";
  public scope: MCPScope;
  public mcpType: MCPType;
  get source(): "hyperchat" | "builtin" {
    return this.mcpType === "builtin" ? "builtin" : "hyperchat";
  }
  public workspacePath?: string;
  public dynamic?: boolean;
  public priority?: number;
  
  public ext: {
    configSchema?: { [s in string]: any };
  } = {};
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS;
  private reconnectDelay = DEFAULT_RECONNECT_DELAY;

  constructor(
    public name: string,
    public config: MCPServerConfig,
    scope: MCPScope,
    public order: number = 0,
    options: {
      mcpType?: MCPType;
      workspacePath?: string;
      dynamic?: boolean;
      priority?: number;
    } = {}
  ) {
    this.scope = scope;
    this.mcpType = options.mcpType || "custom";
    this.workspacePath = options.workspacePath;
    this.dynamic = options.dynamic;
    this.priority = options.priority;

    // 如果是内置服务器，设置配置模式
    if (this.mcpType === "builtin") {
      const server = MyServers.find((s) => s.name === name);
      if (server?.configSchema) {
        this.ext.configSchema = zodToJsonSchema(server.configSchema);
      }
    }
  }

  async callTool(functionName: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error("MCP Client is not initialized");
    }
    await this.ensureConnected();

    const mcpCallToolTimeout = (await AppSetting.init()).mcpCallToolTimeout;
    const timeoutMs = mcpCallToolTimeout * 1000;

    try {
      return await this.client.callTool(
        { name: functionName, arguments: args },
        CallToolResultSchema,
        { timeout: timeoutMs }
      );
    } catch (error) {
      this.logInfo("MCP CallTool Error, trying compatibility mode:", functionName, args, error);
      return await this.callToolCompatibility(functionName, args, timeoutMs);
    }
  }

  private async callToolCompatibility(functionName: string, args: any, timeoutMs: number): Promise<any> {
    if (!this.client) {
      throw new Error("MCP Client is not initialized");
    }
    try {
      const res = await this.client.request(
        {
          method: "tools/call",
          params: { name: functionName, arguments: args },
        },
        CompatibilityCallToolResultSchema,
        { timeout: timeoutMs }
      );

      this.logInfo("CompatibilityCallToolResultSchema success:", res);
      return res.toolResult || res;
    } catch (error) {
      this.logError("MCP CallTool Compatibility Error:", functionName, args, error);
      throw error;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.status === "disconnected") {
      this.logInfo(`is disconnected, attempting to reconnect...`);
      await this.open();
    }
  }

  async callResource(uri: string): Promise<MCPTypes.ReadResourceResult> {
    if (!this.client) {
      throw new Error("MCP Client is not initialized");
    }
    this.logInfo("MCP callResource", uri);
    await this.ensureConnected();
    return await this.client.readResource({ uri });
  }

  async callPrompt(functionName: string, args: any): Promise<any> {
    if (!this.client) {
      throw new Error("MCP Client is not initialized");
    }
    this.logInfo("MCP callPrompt", functionName, args);
    await this.ensureConnected();
    return await this.client.getPrompt({ name: functionName, arguments: args });
  }

  private mapToolsToHyperChatFormat(tools: any[]): HyperChatCompletionTool[] {
    return tools.map((tool, i) => {
      const safeName = this.name.replace(/[^a-zA-Z0-9_-]/g, "") + "_" +
        (tool.name.replace(/[^a-zA-Z0-9_-]/g, "") || i.toString());

      return {
        name: safeName,
        inputSchema: tool.inputSchema,
        description: tool.description,
        type: "function" as const,
        origin_name: tool.name,
        restore_name: `${this.getDisplayName()} > ${tool.name}`,
        clientName: this.name,
        scope: this.scope,
        mcpType: this.mcpType,
        workspacePath: this.workspacePath,
      };
    });
  }

  private mapResourcesToHyperChatFormat(resources: any[]): any[] {
    return resources.map(resource => ({
      ...resource,
      key: `${this.getDisplayName()} > ${resource.name}`,
      clientName: this.name,
      scope: this.scope,
      mcpType: this.mcpType,
      workspacePath: this.workspacePath,
    }));
  }

  private mapPromptsToHyperChatFormat(prompts: any[]): any[] {
    return prompts.map(prompt => ({
      ...prompt,
      key: `${this.getDisplayName()} > ${prompt.name}`,
      clientName: this.name,
      scope: this.scope,
      mcpType: this.mcpType,
      workspacePath: this.workspacePath,
    }));
  }

  toJSON() {
    const { client, ...out } = this;
    return {
      ...out,
      scope: this.scope,
      mcpType: this.mcpType,
      workspacePath: this.workspacePath,
      dynamic: this.dynamic,
      priority: this.priority,
    };
  }

  async close(sendMsg = true): Promise<void> {
    if (this.client) {
      this.client.onclose = () => { };
      this.client.onerror = () => { };
      await this.client.close();
    }
    this.status = "disconnected";
    if (sendMsg) {
      this.notifyStatusChange();
    }
  }

  async open(): Promise<void> {
    if (this.config.disabled) {
      this.status = "disabled";
      return;
    }

    try {
      if (this.client) {
        this.client.onclose = () => { };
        this.client.onerror = () => { };
        await this.client.close();
      }
    } catch (e) {
      this.logError("Error closing client before opening new connection:", e);
    }

    try {
      this.status = "connecting";
      this.notifyStatusChange();
      
      // 添加随机延迟避免同时连接冲突
      await sleep(Math.random() * 1000);
      
      let client: MCP.Client;
      if (this.config?.type === "sse") {
        client = await this.openSse(this.config);
      } else if (this.config?.type === "streamableHttp") {
        client = await this.openStreamableHttp(this.config);
      } else {
        client = await this.openStdio(this.config);
      }

      // 获取工具和资源
      const tools_res = await client.listTools().catch((e) => {
        this.logError("listTools error: ", e);
        return { tools: [] };
      });
      
      const resources_res = await client.listResources().catch((_e) => {
        return { resources: [] };
      });

      // 设置事件处理器
      client.onclose = () => {
        this.logInfo("client connection closed");
        if (this.status === "connected") {
          this.status = "disconnected";
          this.notifyStatusChange();
        }
      };

      client.onerror = (e) => {
        this.logInfo(`client onerror: ${e.message}`);
        this.handleClientError(e);
      };

      // 获取服务器版本信息
      const res = await client.getServerVersion();
      this.version = res?.version || '';
      this.servername = res?.name || '';

      // 映射工具和资源
      this.tools = this.mapToolsToHyperChatFormat(tools_res.tools);
      this.resources = this.mapResourcesToHyperChatFormat(resources_res.resources);

      // 设置资源变化通知处理器
      client.setNotificationHandler(ResourceListChangedNotificationSchema, async (notification) => {
        this.logInfo("Received notification ResourceListChangedNotificationSchema:", notification);
        const resources_res = await client.listResources().catch((_e) => {
          return { resources: [] };
        });
        this.resources = this.mapResourcesToHyperChatFormat(resources_res.resources);
        this.notifyStatusChange();
      });

      this.status = "connected";
      this.notifyStatusChange();
      this.logInfo("client connected successfully");

      this.client = client;
    } catch (e) {
      this.status = "disconnected";
      this.notifyStatusChange();
      this.logError("Failed to connect:", e);
      throw e;
    }
  }

  private async openSse(config: MCPServerConfig): Promise<MCP.Client> {
    const client = new MCP.Client({
      name: this.name,
      version: "1.0.0",
      capabilities: {}
    });

    const url = config?.url;
    if (!url) throw new Error('URL is required for SSE transport');
    
    const transport = new SSEClientTransport(new URL(url), {
      requestInit: {
        keepalive: true,
        headers: config.headers || {},
      }
    });
    
    await client.connect(transport);
    return client;
  }

  private async openStreamableHttp(config: MCPServerConfig): Promise<MCP.Client> {
    const client = new MCP.Client({
      name: this.name,
      version: "1.0.0",
      capabilities: {}
    });
    
    if (!config?.url) throw new Error('URL is required for StreamableHTTP transport');
    
    const transport = new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: {
        keepalive: true,
        headers: config.headers || {},
      }
    });

    await client.connect(transport as any);
    return client;
  }

  private async openStdio(config: MCPServerConfig): Promise<MCP.Client> {
    const env = Object.assign(getMyDefaultEnvironment(), config.env);
    
    if (!config.command) throw new Error('Command is required for stdio transport');
    
    const params = {
      command: config.command,
      args: config.args || [],
      env: env,
    };

    try {
      const transport = new StdioClientTransport(params);
      const client = new MCP.Client({
        name: this.name,
        version: "1.0.0",
        capabilities: {}
      });

      await client.connect(transport);
      return client;
    } catch (e) {
      this.logError("openStdio error:", params, e);
      if (e instanceof Error && e.message.includes("MCP error -32000: Connection closed")) {
        await this.spawnError(config.command!, config.args || [], env);
      }
      throw e;
    }
  }

  private async spawnError(command: string, args: string[], env: Record<string, string>): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        const child = spawn(command, args, {
          stdio: 'pipe',
          cwd: os.homedir(),
          env: env,
          shell: false,
        });
        
        let output = "";
        
        child.stdout?.on('data', (data) => {
          output += data + "\n";
        });

        child.stderr?.on('data', (data) => {
          output += data + "\n";
        });

        child.on('error', (err) => {
          this.logError("Failed to start the child process:", err);
          reject(err);
        });

        child.on('close', (code) => {
          this.logInfo(`The child process exited, exit code: ${code}`);
          if (code !== 0) {
            reject(new Error(`The child process exited, exit code: ${code}\n${output}`));
          } else {
            resolve(code);
          }
        });
      } catch (e) {
        this.logError("Error creating child process:", e);
        reject(e);
      }
    });
  }

  private handleClientError(error: Error) {
    // 错误处理逻辑可以根据需要实现
  }

  notifyStatusChange() {
    getMessageService().sendAllToRenderer({
      type: "changeMcpClient",
      data: this.toJSON(),
    });
  }

  async tryReconnect(): Promise<boolean> {
    if (this.status === "disabled" || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logError(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      }
      this.status = "disconnected";
      this.notifyStatusChange();
      this.reconnectAttempts = 0;
      return false;
    }

    this.reconnectAttempts++;
    this.logInfo(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.status = "connecting";
    this.notifyStatusChange();

    try {
      await sleep(this.reconnectDelay);
      await this.open();
      this.logInfo("Successfully reconnected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = DEFAULT_RECONNECT_DELAY;
      return true;
    } catch (error) {
      this.logError("Failed to reconnect:", error);
      this.reconnectDelay = Math.min(this.reconnectDelay * RECONNECT_BACKOFF_FACTOR, MAX_RECONNECT_DELAY);
      setTimeout(() => this.tryReconnect(), 1000);
      return false;
    }
  }

  /**
   * 获取客户端的唯一标识符
   */
  getUniqueId(): string {
    return this.workspacePath 
      ? `${this.scope}:${this.workspacePath}:${this.name}`
      : `${this.scope}:${this.name}`;
  }

  /**
   * 检查是否为工作区客户端
   */
  isWorkspaceClient(): boolean {
    return this.scope === "workspace" && !!this.workspacePath;
  }

  /**
   * 检查是否为全局客户端
   */
  isGlobalClient(): boolean {
    return this.scope === "global";
  }

  /**
   * 检查是否为内置客户端
   */
  isBuiltinClient(): boolean {
    return this.mcpType === "builtin";
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    const typePrefix = this.mcpType === "builtin" ? "[内置]" : "[自定义]";
    const scopePrefix = this.scope === "global" ? "[全局]" : "[工作区]";
    return `${typePrefix}${scopePrefix} ${this.name}`;
  }

  /**
   * 获取客户端配置的保存路径
   */
  getConfigPath(): string {
    switch (this.scope) {
      case "global":
        return "global";
      case "workspace":
        return this.workspacePath || "unknown";
      default:
        return "unknown";
    }
  }

  /**
   * 记录日志时添加范围信息
   */
  private logInfo(message: string, ...args: any[]) {
    Logger.info(`[${this.scope.toUpperCase()}:${this.mcpType.toUpperCase()}] ${this.name}: ${message}`, ...args);
  }

  /**
   * 记录错误时添加范围信息
   */
  private logError(message: string, ...args: any[]) {
    Logger.error(`[${this.scope.toUpperCase()}:${this.mcpType.toUpperCase()}] ${this.name}: ${message}`, ...args);
  }
}