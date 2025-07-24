/**
 * Agent专属MCP管理器
 * 简化版本，去掉scope概念，每个Agent管理自己的MCP配置
 */

import * as path from "path";
import * as fs from "fs";
import type {
  WorkspaceMCPConfig,
  MCPManagerOptions,
  MCPManagerEvents
} from "./mcp/types.mjs";
import { WorkspaceMCPClientImpl } from "./mcp/client.mjs";
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import { Logger } from "../log.mjs";
import { CONSTANTS } from "./constants.mjs";

export class AgentMCPManager {
  private clients: Map<string, WorkspaceMCPClientImpl> = new Map();
  private agentConfig: WorkspaceMCPConfig | null = null;
  private options: MCPManagerOptions;
  private events: MCPManagerEvents;
  private agentPath: string;
  constructor(agentPath: string, options: MCPManagerOptions = {}, events: MCPManagerEvents = {}) {
    this.agentPath = agentPath;
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
   * 启动所有MCP客户端
   */
  async startClients(): Promise<WorkspaceMCPClientImpl[]> {
    try {
      // 加载Agent的MCP配置
      await this.loadAgentConfig();
      
      if (!this.agentConfig || !this.agentConfig.mcpServers) {
        Logger.info(`Agent ${path.basename(this.agentPath)} 没有MCP配置`);
        return [];
      }

      // 启动所有未禁用的服务器
      const startPromises = Object.entries(this.agentConfig.mcpServers).map(async ([name, serverConfig]) => {
        if (!serverConfig.disabled) {
          await this.startSingleClient(name, serverConfig);
        }
      });

      await Promise.all(startPromises);
      
      const clients = Array.from(this.clients.values());
      Logger.info(`Agent ${path.basename(this.agentPath)} 启动了 ${clients.length} 个MCP客户端`);
      return clients;
    } catch (error) {
      Logger.error(`Agent ${path.basename(this.agentPath)} 启动MCP客户端失败:`, error);
      throw error;
    }
  }

  /**
   * 启动单个自定义MCP客户端
   */
  private async startSingleClient(name: string, serverConfig: MCPServerConfig): Promise<void> {
    try {
      const client = new WorkspaceMCPClientImpl(
        name,
        serverConfig,
        "workspace", // Agent作为工作区级别处理
        0, // order简化为0
        {
          mcpType: "custom",
          workspacePath: this.agentPath,
          globalPath: this.agentPath,
        }
      );

      await this.startClient(client, name);
    } catch (error) {
      Logger.error(`启动Agent MCP客户端失败 [${name}]:`, error);
      throw error;
    }
  }


  /**
   * 启动MCP客户端
   */
  private async startClient(client: WorkspaceMCPClientImpl, clientId: string): Promise<void> {
    try {
      await client.open();
      this.clients.set(clientId, client);
      Logger.info(`Agent MCP客户端已启动: ${clientId}`);
    } catch (error) {
      Logger.error(`Agent MCP客户端启动失败 [${clientId}]:`, error);
      throw error;
    }
  }

  /**
   * 停止所有MCP客户端
   */
  async stopClients(): Promise<void> {
    const clientsToStop = Array.from(this.clients.values());
    
    const tasks = clientsToStop.map(async (client) => {
      try {
        await client.close();
        Logger.info(`Agent MCP客户端已停止: ${client.serverName}`);
      } catch (error) {
        Logger.error(`停止Agent MCP客户端失败 [${client.serverName}]:`, error);
      }
    });

    await Promise.all(tasks);
    this.clients.clear();
    Logger.info(`Agent ${path.basename(this.agentPath)} 所有MCP客户端已停止`);
  }

  /**
   * 加载Agent的MCP配置
   */
  async loadAgentConfig(): Promise<WorkspaceMCPConfig> {
    const configPath = path.join(this.agentPath, CONSTANTS.CONFIG_FILES.MCP);
    
    try {
      if (fs.existsSync(configPath)) {
        const content = await fs.promises.readFile(configPath, "utf-8");
        this.agentConfig = JSON.parse(content) as WorkspaceMCPConfig;
      } else {
        // 没有配置文件，创建空配置
        this.agentConfig = {
          mcpServers: {},
          workspacePath: this.agentPath,
          created: Date.now(),
          lastModified: Date.now(),
        };
      }

      // 确保路径正确
      this.agentConfig.workspacePath = this.agentPath;
      return this.agentConfig;
    } catch (error) {
      Logger.error(`加载Agent MCP配置失败: ${configPath}`, error);
      throw error;
    }
  }

  /**
   * 保存Agent的MCP配置
   */
  private async saveConfig(): Promise<void> {
    if (!this.agentConfig) {
      return;
    }

    const configPath = path.join(this.agentPath, CONSTANTS.CONFIG_FILES.MCP);
    
    try {
      // 确保目录存在
      await this.ensureDirectoryExists(path.dirname(configPath));
      
      // 更新修改时间
      this.agentConfig.lastModified = Date.now();
      
      // 保存配置
      const content = JSON.stringify(this.agentConfig, null, 2);
      await fs.promises.writeFile(configPath, content, "utf-8");
      
      Logger.info(`Agent MCP配置已保存: ${configPath}`);
    } catch (error) {
      Logger.error(`保存Agent MCP配置失败: ${configPath}`, error);
      throw error;
    }
  }

  /**
   * 设置服务器配置
   */
  async setServerConfig(name: string, serverConfig: MCPServerConfig): Promise<void> {
    await this.loadAgentConfig();
    
    if (!this.agentConfig) {
      this.agentConfig = {
        mcpServers: {},
        workspacePath: this.agentPath,
        created: Date.now(),
        lastModified: Date.now(),
      };
    }

    // 如果是新服务器，分配order
    // Agent简化版本，不需要order管理

    this.agentConfig.mcpServers[name] = serverConfig;
    await this.saveConfig();
    
    // 触发配置更新事件
    if (this.events.onConfigUpdate) {
      this.events.onConfigUpdate(this.agentConfig);
    }
  }

  /**
   * 删除服务器配置
   */
  async deleteServerConfig(name: string): Promise<void> {
    await this.loadAgentConfig();
    
    if (this.agentConfig && this.agentConfig.mcpServers[name]) {
      delete this.agentConfig.mcpServers[name];
      await this.saveConfig();
      
      // 停止对应的客户端
      const client = this.clients.get(name);
      if (client) {
        await client.close();
        this.clients.delete(name);
      }
      
      // 触发配置更新事件
      if (this.events.onConfigUpdate) {
        this.events.onConfigUpdate(this.agentConfig);
      }
    }
  }

  /**
   * 重启客户端
   */
  async restartClient(name: string): Promise<void> {
    await this.stopClient(name);
    
    if (this.agentConfig && this.agentConfig.mcpServers[name]) {
      const serverConfig = this.agentConfig.mcpServers[name];
      if (!serverConfig.disabled) {
        await this.startSingleClient(name, serverConfig);
      }
    }
  }

  /**
   * 停止单个客户端
   */
  async stopClient(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      try {
        await client.close();
        this.clients.delete(name);
        Logger.info(`Agent MCP客户端已停止: ${name}`);
      } catch (error) {
        Logger.error(`停止Agent MCP客户端失败 [${name}]:`, error);
        throw error;
      }
    }
  }

  /**
   * 获取所有客户端
   */
  getClients(): WorkspaceMCPClientImpl[] {
    return Array.from(this.clients.values());
  }

  /**
   * 获取指定客户端
   */
  getClient(name: string): WorkspaceMCPClientImpl | undefined {
    return this.clients.get(name);
  }

  /**
   * 获取当前配置
   */
  getConfig(): WorkspaceMCPConfig | null {
    return this.agentConfig;
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
    } catch (error) {
      Logger.error(`创建目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 销毁管理器
   */
  async destroy(): Promise<void> {
    await this.stopClients();
    this.clients.clear();
    this.agentConfig = null;
  }
}