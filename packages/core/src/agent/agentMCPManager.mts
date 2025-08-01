/**
 * Agent专属MCP管理器 - 重构版
 * 职责: 负责配置合并，将实际MCP管理委托给WorkspaceMCPManager
 */

import * as path from "path";
import * as fs from "fs";
import type {
  WorkspaceMCPConfig,
  MCPManagerEvents
} from "./mcp/types.mjs";
import { MCPManager } from "./mcp/manager.mjs";
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


export class AgentMCPManager {
  private agentConfig: WorkspaceMCPConfig | null = null;
  private agentPath: string;
  public mcpManager: MCPManager;

  constructor(agentPath: string, events: MCPManagerEvents = {}) {
    this.agentPath = agentPath;

    // 创建委托的WorkspaceMCPManager实例
    // 使用Agent路径作为工作路径，这样它会在Agent目录下管理MCP
    this.mcpManager = new MCPManager(agentPath, {}, events);
  }

  /**
   * 从Agent路径推导工作区路径
   * 例如: /path/to/workspace/.hyperchat/agents/agentName -> /path/to/workspace
   */
  private deriveWorkspacePath(): string {
    // 简单的路径推导逻辑：往上找到包含.hyperchat的目录
    let currentPath = this.agentPath;
    while (currentPath !== path.dirname(currentPath)) {
      const parent = path.dirname(currentPath);
      if (path.basename(parent) === '.hyperchat') {
        return path.dirname(parent);
      }
      currentPath = parent;
    }
    // 如果找不到，返回当前路径的上级目录
    return path.dirname(this.agentPath);
  }

  /**
   * 启动所有MCP客户端 - 委托给WorkspaceMCPManager
   */
  async startClients(): Promise<WorkspaceMCPClientImpl[]> {
    try {
      // 加载并合并Agent的MCP配置
      await this.loadAgentMCPConfig();

      // 委托给WorkspaceMCPManager处理
      return await this.mcpManager.startClients();
    } catch (error) {
      Logger.error(`启动Agent MCP客户端失败 (${this.agentPath}):`, error);
      throw error;
    }
  }

  /**
   * 停止所有MCP客户端 - 委托给WorkspaceMCPManager
   */
  async stopClients(): Promise<void> {
    return await this.mcpManager.stopClients();
  }

  /**
   * 获取所有客户端 - 委托给WorkspaceMCPManager
   */
  getAllClients(): WorkspaceMCPClientImpl[] {
    return this.mcpManager.getAllClients();
  }

  /**
   * 获取所有客户端 (兼容性别名) - 委托给WorkspaceMCPManager
   */
  getClients(): WorkspaceMCPClientImpl[] {
    return this.getAllClients();
  }

  /**
   * 获取单个客户端 - 委托给WorkspaceMCPManager
   */
  getClient(name: string): WorkspaceMCPClientImpl | undefined {
    const client = this.mcpManager.getClient(name);
    return client || undefined;
  }

  /**
   * 重启客户端 - 委托给WorkspaceMCPManager
   */
  async restartClient(name: string): Promise<void> {
    return await this.mcpManager.restartClient(name);
  }

  /**
   * 停止单个客户端 - 委托给WorkspaceMCPManager
   */
  async stopClient(name: string): Promise<void> {
    return await this.mcpManager.stopClient(name);
  }

  /**
   * 销毁管理器 - 委托给WorkspaceMCPManager
   */
  async destroy(): Promise<void> {
    return await this.mcpManager.destroy();
  }

  /**
   * 加载并合并Agent的MCP配置
   * 合并工作区配置和Agent专属配置
   * 优先级: 工作区 < Agent专属 (高优先级覆盖低优先级)
   */
  async loadAgentMCPConfig(): Promise<WorkspaceMCPConfig> {
    try {
      const mergedServers: Record<string, AgentMCPServerConfig> = {};

      // 1. 加载工作区级别的MCP配置 (作为基础配置)
      const workspacePath = this.deriveWorkspacePath();
      const workspaceConfigPath = path.join(workspacePath, CONSTANTS.HYPERCHAT_DIR, 'mcp.json');

      if (fs.existsSync(workspaceConfigPath)) {
        try {
          const workspaceConfig = await this.loadConfigFromPath(workspaceConfigPath, 'workspace');
          if (workspaceConfig.mcpServers) {
            Object.entries(workspaceConfig.mcpServers).forEach(([name, config]) => {
              mergedServers[name] = {
                ...config,
                _sourcePath: workspaceConfigPath
              };
            });
          }
        } catch (error) {
          Logger.warn(`加载工作区MCP配置失败: ${workspaceConfigPath}`, error);
        }
      }

      // 2. 加载Agent专属的MCP配置 (会覆盖工作区配置)
      const agentConfigPath = path.join(this.agentPath, 'mcp.json');

      if (fs.existsSync(agentConfigPath)) {
        try {
          const agentConfig = await this.loadConfigFromPath(agentConfigPath, 'agent');
          if (agentConfig.mcpServers) {
            Object.entries(agentConfig.mcpServers).forEach(([name, config]) => {
              mergedServers[name] = {
                ...config,
                _sourcePath: agentConfigPath
              };
            });
          }
        } catch (error) {
          Logger.warn(`加载Agent MCP配置失败: ${agentConfigPath}`, error);
        }
      }

      // 3. 构建最终的合并配置
      this.agentConfig = {
        mcpServers: mergedServers,
        workspacePath: this.deriveWorkspacePath(),
      };

      // 4. 将合并后的配置传递给WorkspaceMCPManager
      // 这里我们需要将配置写入到Agent目录，让WorkspaceMCPManager能够读取
      await this.saveMergedConfigToAgent();

      Logger.info(`✅ Agent MCP配置加载完成，共${Object.keys(mergedServers).length}个服务器`, {
        agentPath: this.agentPath,
        servers: Object.keys(mergedServers)
      });

      return this.agentConfig;

    } catch (error) {
      Logger.error("❌ 加载Agent MCP配置失败:", error);
      throw error;
    }
  }

  /**
   * 从指定路径加载MCP配置
   */
  private async loadConfigFromPath(
    configPath: string,
    source: 'workspace' | 'agent'
  ): Promise<WorkspaceMCPConfig> {
    try {
      const content = await fs.promises.readFile(configPath, 'utf8');
      const config = JSON.parse(content) as WorkspaceMCPConfig;

      // 验证配置格式
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid MCP config format');
      }

      Logger.debug(`📁 从${source}加载MCP配置: ${configPath}`, {
        serverCount: config.mcpServers ? Object.keys(config.mcpServers).length : 0
      });

      return {
        mcpServers: config.mcpServers || {},
        workspacePath: configPath,
      };
    } catch (error) {
      Logger.warn(`⚠️ 加载${source}MCP配置失败: ${configPath}`, error);
      return {
        mcpServers: {},
        workspacePath: configPath,
      };
    }
  }

  /**
   * 将合并后的配置保存到Agent目录，供WorkspaceMCPManager读取
   */
  private async saveMergedConfigToAgent(): Promise<void> {
    if (!this.agentConfig) {
      return;
    }

    try {
      const configPath = path.join(this.agentPath, 'mcp.json');

      // 创建不包含_sourcePath的干净配置用于保存  
      const cleanConfig: WorkspaceMCPConfig = {
        mcpServers: {},
        workspacePath: this.agentPath,
      };

      Object.entries(this.agentConfig.mcpServers).forEach(([name, config]) => {
        cleanConfig.mcpServers[name] = config;
      });

      await fs.promises.writeFile(
        configPath,
        JSON.stringify(cleanConfig, null, 2),
        'utf8'
      );

      Logger.debug(`💾 合并后的MCP配置已保存: ${configPath}`);
    } catch (error) {
      Logger.error("❌ 保存合并MCP配置失败:", error);
      throw error;
    }
  }

  /**
   * 设置服务器配置 - 委托给WorkspaceMCPManager
   */
  async setServerConfig(name: string, serverConfig: MCPServerConfig): Promise<void> {
    await this.loadAgentMCPConfig();
    return await this.mcpManager.setServerConfig(name, serverConfig);
  }

  /**
   * 删除服务器配置 - 委托给WorkspaceMCPManager
   */
  async deleteServerConfig(name: string): Promise<void> {
    await this.loadAgentMCPConfig();
    return await this.mcpManager.deleteServerConfig(name);
  }

}