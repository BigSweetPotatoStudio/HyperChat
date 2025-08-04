import { MCPServerConfig, IMCPClient } from "@dadigua/hyperchat-shared/types";
import { getWorkspaceManager, workspaceManager } from "../workspace/index.mjs";

// findAgentByMcpClient 函数已移除，因为现在使用工作区级别的 MCP 管理

/**
 * 获取工作区级别的所有MCP客户端列表
 */
async function getAllMcpClients(): Promise<Record<string, unknown>[]> {
  const workspace = workspaceManager.getCurrentWorkspace();
  const mcpManager = workspace.getMcpManager();
  
  if (!mcpManager) {
    return [];
  }
  
  return mcpManager.getAllClients().map(client => client.toJSON());
}

/**
 * MCP 管理相关命令 - Agent-centered架构版本
 * 所有MCP管理都通过Agent实例处理
 */
export const mcpCommands = {

  /**
   * 强制重新加载MCP配置文件 - 工作区级别
   * 停止工作区的MCP客户端，重新读取配置文件，然后重新启动
   * 用于在配置文件被外部修改时同步更新
   * @returns 返回重新加载后的客户端列表
   */
  async forceReloadMcpClients() {
    try {
      return await this.forceReloadWorkspaceMcpClients();
    } catch (error) {
      console.error("Failed to force reload MCP clients:", error);
      throw error;
    }
  },

  /**
   * 启动或重启指定的MCP客户端 - 工作区级别
   * @param clientName MCP客户端名称
   * @param clientConfig MCP服务器配置（可选，用于添加新客户端）
   * @returns 操作结果
   */
  async startWorkspaceMcpClient({
    clientName,
    clientConfig
  }: {
    clientName: string;
    clientConfig?: MCPServerConfig;
  }) {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const mcpManager = workspace.getMcpManager();
      if (!mcpManager) {
        throw new Error('工作区 MCP 管理器未初始化');
      }

      if (clientConfig) {
        // 如果提供了配置，先设置配置再启动
        await mcpManager.setServerConfig(clientName, clientConfig);
      } else {
        // 如果没有配置，尝试重启现有客户端
        await mcpManager.restartClient(clientName);
      }

      return {
        success: true,
        clientName
      };
    } catch (error) {
      console.error(`Failed to start MCP client ${clientName}:`, error);
      throw error;
    }
  },


  /**
   * 管理MCP客户端生命周期 - Agent-centered版本
   * @param clientName MCP客户端名称
   * @param action 操作类型
   * @param agentName 所属Agent名称，如果未指定则自动查找
   * @returns 操作结果
   */
  async manageWorkspaceMcpClient({
    clientName,
    action,
    agentName,
    workspacePath
  }: {
    clientName: string;
    action: 'restart' | 'disable' | 'enable' | 'delete';
    agentName?: string;
    workspacePath?: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
        if (!workspace.isStarted()) {
          await workspace.start();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }
      
      const mcpManager = workspace.getMcpManager();
      
      if (!mcpManager) {
        throw new Error('工作区 MCP 管理器未初始化');
      }

      // 检查客户端是否存在
      const client = mcpManager.getClient(clientName);
      if (!client) {
        throw new Error(`MCP客户端 "${clientName}" 不存在`);
      }

      switch (action) {
        case 'restart':
          await mcpManager.restartClient(clientName);
          break;
        case 'disable':
          await mcpManager.disableClient(clientName);
          break;
        case 'enable':
          await mcpManager.enableClient(clientName);
          break;
        case 'delete':
          await mcpManager.deleteServerConfig(clientName);
          break;
        default:
          throw new Error(`不支持的操作: ${action}`);
      }

      return {
        success: true,
        action,
        clientName
      };
    } catch (error) {
      console.error(`Failed to ${action} MCP client ${clientName}:`, error);
      throw error;
    }
  },

  /**
   * 调用指定 MCP 客户端的工具函数 - 工作区级别
   * 用于执行 MCP 服务提供的各种功能（如文件操作、系统调用等）
   * @param name MCP客户端名称（如 hyper_tools、knowledge_base 等）
   * @param functionName 要调用的工具函数名称
   * @param args 传递给工具函数的参数对象
   * @returns 工具函数的执行结果
   * @throws 如果指定的MCP客户端不存在或工具调用失败
   */
  async mcpCallTool({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    const workspace = workspaceManager.getCurrentWorkspace();
    const mcpManager = workspace.getMcpManager();
    
    if (!mcpManager) {
      throw new Error('工作区 MCP 管理器未初始化');
    }

    const client = mcpManager.getClient(name);
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }
    
    return await client.callTool(functionName, args);
  },

  /**
   * 调用指定工作区的 MCP 客户端工具函数 - 工作区级别
   * @deprecated 建议直接使用mcpCallTool方法
   */
  async mcpCallToolWithWorkspace({
    workspacePath,
    name,
    functionName,
    args,
    abortController
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
    abortController?: AbortController;
  }) {
    // Delegate to the updated mcpCallTool method
    return await this.mcpCallTool({
      name,
      functionName,
      args
    });
  },

  /**
   * 获取指定 MCP 客户端的资源内容 - 工作区级别
   * 用于访问 MCP 服务提供的各种资源（如文件内容、数据等）
   * @param name MCP客户端名称
   * @param uri 资源URI（格式由具体MCP服务定义）
   * @returns 资源的内容数据
   * @throws 如果指定的MCP客户端不存在或资源访问失败
   */
  async mcpCallResource({
    name,
    uri
  }: {
    name: string;
    uri: string;
  }) {
    const workspace = workspaceManager.getCurrentWorkspace();
    const mcpManager = workspace.getMcpManager();
    
    if (!mcpManager) {
      throw new Error('工作区 MCP 管理器未初始化');
    }

    const client = mcpManager.getClient(name);
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }
    
    return await client.callResource(uri);
  },



  /**
   * 调用指定 MCP 客户端的提示模板 - 工作区级别
   * 用于获取预定义的提示内容，通常用于AI对话或任务执行
   * @param name MCP客户端名称
   * @param functionName 提示模板函数名称
   * @param args 传递给提示模板的参数
   * @returns 渲染后的提示内容
   * @throws 如果指定的MCP客户端不存在或提示调用失败
   */
  async mcpCallPrompt({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    const workspace = workspaceManager.getCurrentWorkspace();
    const mcpManager = workspace.getMcpManager();
    
    if (!mcpManager) {
      throw new Error('工作区 MCP 管理器未初始化');
    }

    const client = mcpManager.getClient(name);
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }
    
    return await client.callPrompt(functionName, args);
  },

  /**
   * 启动工作区 MCP 服务 - 工作区级别
   * 启动工作区级别的MCP客户端
   */
  async startWorkspaceMcpClients(): Promise<IMCPClient[]> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const mcpManager = workspace.getMcpManager();
      
      if (mcpManager) {
        await mcpManager.startClients();
      }
      
      return await this.getWorkspaceMcpClients();
    } catch (error) {
      console.error('Failed to start workspace MCP clients:', error);
      throw error;
    }
  },

  /**
   * 强制重新加载工作区MCP配置 - 工作区级别
   * 重新加载工作区级别的MCP客户端
   */
  async forceReloadWorkspaceMcpClients(): Promise<IMCPClient[]> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const mcpManager = workspace.getMcpManager();
      
      if (mcpManager) {
        // 停止所有客户端
        await mcpManager.stopClients();
        // 重新加载配置并启动
        await mcpManager.loadWorkspaceConfig();
        await mcpManager.startClients();
      }
      
      return await this.getWorkspaceMcpClients();
    } catch (error) {
      console.error('Failed to force reload workspace MCP clients:', error);
      throw error;
    }
  },


  /**
   * 添加或更新 MCP 服务器配置 - 工作区级别
   */
  async setWorkspaceMcpServerConfig({
    serverName,
    serverConfig,
    workspacePath
  }: {
    serverName: string;
    serverConfig: MCPServerConfig;
    workspacePath?: string;
  }): Promise<void> {
    const workspaceManager = getWorkspaceManager();
    let workspace;
    
    if (workspacePath) {
      workspace = await workspaceManager.get(workspacePath, true);
      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }
      if (!workspace.isStarted()) {
        await workspace.start();
      }
    } else {
      workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }
    }
    
    const mcpManager = workspace.getMcpManager();
    
    if (!mcpManager) {
      throw new Error('工作区 MCP 管理器未初始化');
    }
    
    return await mcpManager.setServerConfig(serverName, serverConfig);
  },

  /**
   * 删除 MCP 服务器配置 - 工作区级别
   */
  async deleteWorkspaceMcpServerConfig({
    serverName,
    workspacePath
  }: {
    serverName: string;
    workspacePath?: string;
  }): Promise<void> {
    const workspaceManager = getWorkspaceManager();
    let workspace;
    
    if (workspacePath) {
      workspace = await workspaceManager.get(workspacePath, true);
      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }
      if (!workspace.isStarted()) {
        await workspace.start();
      }
    } else {
      workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }
    }
    
    const mcpManager = workspace.getMcpManager();
    
    if (!mcpManager) {
      throw new Error('工作区 MCP 管理器未初始化');
    }
    
    return await mcpManager.deleteServerConfig(serverName);
  },



  /**
   * 获取工作区 MCP 客户端 - 使用工作区级别的MCP管理器
   * 直接从工作区的MCP管理器获取客户端，不再从Agent聚合
   */
  async getWorkspaceMcpClients(): Promise<IMCPClient[]> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        console.warn("当前没有可用的工作区");
        return [];
      }

      // 直接从工作区的MCP管理器获取客户端
      return workspace.getMcpClients();
    } catch (error) {
      console.error("Failed to get workspace MCP clients:", error);
      return [];
    }
  },

 
};