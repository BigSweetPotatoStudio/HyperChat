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

/**
 * 扩展MCP配置，添加来源路径信息
 */
export interface AgentMCPServerConfig extends MCPServerConfig {
  /**
   * 配置文件来源路径
   */
  _sourcePath: string;
}

/**
 * Agent专属MCP配置
 */
export interface AgentMCPConfig extends Omit<WorkspaceMCPConfig, 'mcpServers'> {
  mcpServers: Record<string, AgentMCPServerConfig>;
}

export class AgentMCPManager {
  private clients: Map<string, WorkspaceMCPClientImpl> = new Map();
  private agentConfig: AgentMCPConfig | null = null;
  private events: MCPManagerEvents;
  private agentPath: string;

  constructor(agentPath: string, events: MCPManagerEvents = {}) {
    this.agentPath = agentPath;
    this.events = events;
  }

  /**
   * 从Agent路径推导工作区路径
   * 例如: /path/to/workspace/.hyperchat/agents/agentName -> /path/to/workspace
   */
  private getWorkspacePath(): string | undefined {
    // Agent路径结构: workspacePath/.hyperchat/agents/agentName
    const agentsDirIndex = this.agentPath.indexOf(path.join(CONSTANTS.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS));
    if (agentsDirIndex === -1) {
      return undefined;
    }
    return this.agentPath.substring(0, agentsDirIndex);
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
  private async startSingleClient(name: string, serverConfig: AgentMCPServerConfig): Promise<void> {
    try {
      // 根据来源路径判断scope
      const isGlobal = serverConfig._sourcePath.includes(CONSTANTS.GLOBAL_HYPERCHAT_DIR_PATH);
      const scope = isGlobal ? "global" : "workspace";

      const client = new WorkspaceMCPClientImpl(
        name,
        serverConfig,
        scope,
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
   * 加载并合并层次化MCP配置
   * 优先级: 全局 < 工作区 < Agent专属 (高优先级覆盖低优先级)
   */
  async loadAgentConfig(): Promise<AgentMCPConfig> {
    try {
      const mergedServers: Record<string, AgentMCPServerConfig> = {};

      // 1. 加载全局MCP配置
      await this.loadConfigFromPath(
        path.join(CONSTANTS.GLOBAL_HYPERCHAT_DIR_PATH, CONSTANTS.CONFIG_FILES.MCP),
        "全局配置",
        mergedServers
      );



      await this.loadConfigFromPath(
        path.join(this.agentPath, "../../", CONSTANTS.CONFIG_FILES.MCP),
        "工作区配置",
        mergedServers
      );


      // 3. 加载Agent专属MCP配置 (最高优先级)
      await this.loadConfigFromPath(
        path.join(this.agentPath, CONSTANTS.CONFIG_FILES.MCP),
        "Agent配置",
        mergedServers
      );

      // 构建最终配置
      this.agentConfig = {
        mcpServers: mergedServers,
        workspacePath: this.agentPath,
        created: Date.now(),
        lastModified: Date.now(),
      };

      Logger.info(`Agent ${path.basename(this.agentPath)} 合并MCP配置: ${Object.keys(mergedServers).length} 个服务器`);
      return this.agentConfig;
    } catch (error) {
      Logger.error(`加载Agent MCP配置失败:`, error);
      throw error;
    }
  }

  /**
   * 从指定路径加载MCP配置并合并到目标对象
   */
  private async loadConfigFromPath(
    configPath: string,
    sourceLabel: string,
    mergedServers: Record<string, AgentMCPServerConfig>
  ): Promise<void> {
    try {
      if (!fs.existsSync(configPath)) {
        Logger.debug(`MCP配置文件不存在: ${configPath}`);
        return;
      }

      const content = await fs.promises.readFile(configPath, "utf-8");
      const config = JSON.parse(content) as WorkspaceMCPConfig;

      if (config.mcpServers) {
        // 遍历配置中的每个服务器，添加来源路径信息
        for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
          const enhancedConfig: AgentMCPServerConfig = {
            ...serverConfig,
            _sourcePath: configPath
          };

          // 高优先级配置覆盖低优先级配置
          mergedServers[name] = enhancedConfig;
        }

        Logger.debug(`从 ${sourceLabel} 加载了 ${Object.keys(config.mcpServers).length} 个MCP服务器配置: ${configPath}`);
      }
    } catch (error) {
      Logger.warn(`读取MCP配置文件失败 [${sourceLabel}]: ${configPath}`, error);
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

      // 创建不包含_sourcePath的干净配置用于保存
      const cleanConfig: WorkspaceMCPConfig = {
        mcpServers: {},
        workspacePath: this.agentConfig.workspacePath,
        created: this.agentConfig.created,
        lastModified: Date.now(),
      };

      // 移除_sourcePath属性，只保存基础配置
      for (const [name, serverConfig] of Object.entries(this.agentConfig.mcpServers)) {
        const { _sourcePath, ...cleanServerConfig } = serverConfig;
        cleanConfig.mcpServers[name] = cleanServerConfig;
      }

      // 保存配置
      const content = JSON.stringify(cleanConfig, null, 2);
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

    // 将基础配置转换为带来源路径的配置
    const agentMcpPath = path.join(this.agentPath, CONSTANTS.CONFIG_FILES.MCP);
    const enhancedConfig: AgentMCPServerConfig = {
      ...serverConfig,
      _sourcePath: agentMcpPath
    };

    this.agentConfig.mcpServers[name] = enhancedConfig;
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