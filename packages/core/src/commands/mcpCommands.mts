import { MCPServerConfig, IMCPClient } from "@dadigua/hyperchat-shared/types";
import { getWorkspaceManager, workspaceManager } from "../workspace/index.mjs";

/**
 * 查找指定名称的MCP客户端所属的Agent
 */
async function findAgentByMcpClient(clientName: string): Promise<{ agentName: string; agentInstance: any } | null> {
  const workspace = workspaceManager.getCurrentWorkspace();
  const agents = await workspace.getAllAgents();
  
  for (const agentConfig of agents) {
    const agentInstance = workspace.getAgentInstance(agentConfig.name);
    if (agentInstance) {
      const client = agentInstance.getMCPClient(clientName);
      if (client) {
        return { agentName: agentConfig.name, agentInstance };
      }
    }
  }
  return null;
}

/**
 * 获取所有Agent的MCP客户端聚合列表
 */
async function getAllMcpClients(): Promise<Record<string, unknown>[]> {
  const workspace = workspaceManager.getCurrentWorkspace();
  const agents = await workspace.getAllAgents();
  const allClients: Record<string, unknown>[] = [];
  
  for (const agentConfig of agents) {
    const agentInstance = workspace.getAgentInstance(agentConfig.name);
    if (agentInstance) {
      const clients = agentInstance.getMCPClients();
      // 为每个客户端添加Agent信息
      const clientsWithAgent = clients.map(client => ({
        ...client.toJSON(),
        agentName: agentConfig.name, // 标记客户端所属的Agent
      }));
      allClients.push(...clientsWithAgent);
    }
  }
  
  return allClients;
}

/**
 * MCP 管理相关命令 - Agent-centered架构版本
 * 所有MCP管理都通过Agent实例处理
 */
export const mcpCommands = {

  /**
   * 强制重新加载MCP配置文件 - Agent-centered版本
   * 停止所有Agent的MCP客户端，重新读取配置文件，然后重新启动
   * 用于在配置文件被外部修改时同步更新
   * @returns 返回重新加载后的客户端列表
   */
  async forceReloadMcpClients() {
    try {
      // 停止所有Agent的MCP客户端
      await this.stopAllAgentMcpClients();
      
      // 重新启动所有Agent的MCP客户端
      await this.startAllAgentMcpClients();
      
      // 返回重新加载后的客户端列表
      return await this.getWorkspaceMcpClients();
    } catch (error) {
      console.error("Failed to force reload MCP clients:", error);
      throw error;
    }
  },

  /**
   * 启动或重启指定的MCP客户端 - Agent-centered版本
   * @param clientName MCP客户端名称
   * @param clientConfig MCP服务器配置（可选，用于添加新客户端）
   * @param agentName 可选的Agent名称，如果未指定则自动查找或使用第一个Agent
   * @returns 操作结果
   */
  async startWorkspaceMcpClient({
    clientName,
    clientConfig,
    agentName
  }: {
    clientName: string;
    clientConfig?: MCPServerConfig;
    agentName?: string;
  }) {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      let targetAgentName = agentName;
      
      if (!targetAgentName) {
        if (clientConfig) {
          // 如果没有指定Agent但提供了配置，使用第一个可用Agent
          const agents = await workspace.getAllAgents();
          if (agents.length === 0) {
            throw new Error('没有可用的Agent来添加MCP客户端');
          }
          targetAgentName = agents[0].name;
        } else {
          // 如果没有配置，尝试查找现有客户端所属的Agent
          const result = await findAgentByMcpClient(clientName);
          if (!result) {
            throw new Error(`MCP客户端 "${clientName}" 不存在，且未指定Agent`);
          }
          targetAgentName = result.agentName;
        }
      }

      const agentInstance = workspace.getAgentInstance(targetAgentName);
      if (!agentInstance) {
        throw new Error(`Agent "${targetAgentName}" 不存在`);
      }

      if (clientConfig) {
        // 如果提供了配置，先设置配置再启动
        await agentInstance.setMCPServerConfig(clientName, clientConfig);
        await agentInstance.startMCPClients();
      } else {
        // 如果没有配置，尝试重启现有客户端
        await agentInstance.restartMCPClient(clientName);
      }

      return {
        success: true,
        clientName,
        agentName: targetAgentName
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
    agentName
  }: {
    clientName: string;
    action: 'restart' | 'disable' | 'enable' | 'delete';
    agentName?: string;
  }) {
    try {
      let targetAgentName = agentName;
      
      if (!targetAgentName) {
        // 如果没有指定Agent，自动查找客户端所属的Agent
        const result = await findAgentByMcpClient(clientName);
        if (!result) {
          throw new Error(`MCP客户端 "${clientName}" 不存在，且未指定Agent`);
        }
        targetAgentName = result.agentName;
      }

      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(targetAgentName);
      if (!agentInstance) {
        throw new Error(`Agent "${targetAgentName}" 不存在`);
      }

      switch (action) {
        case 'restart':
          await agentInstance.restartMCPClient(clientName);
          break;
        case 'disable':
          await agentInstance.stopMCPClients();
          break;
        case 'enable':
          await agentInstance.startMCPClients();
          break;
        case 'delete':
          await agentInstance.deleteMCPServerConfig(clientName);
          break;
        default:
          throw new Error(`不支持的操作: ${action}`);
      }

      return {
        success: true,
        action,
        clientName,
        agentName: targetAgentName
      };
    } catch (error) {
      console.error(`Failed to ${action} MCP client ${clientName}:`, error);
      throw error;
    }
  },

  /**
   * 调用指定 MCP 客户端的工具函数 - Agent-centered版本
   * 用于执行 MCP 服务提供的各种功能（如文件操作、系统调用等）
   * @param name MCP客户端名称（如 hyper_tools、knowledge_base 等）
   * @param functionName 要调用的工具函数名称
   * @param args 传递给工具函数的参数对象
   * @param agentName 可选的Agent名称，如果未指定则自动查找
   * @returns 工具函数的执行结果
   * @throws 如果指定的MCP客户端不存在或工具调用失败
   */
  async mcpCallTool({
    name,
    functionName,
    args,
    agentName
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
    agentName?: string;
  }) {
    let targetAgent;
    
    if (agentName) {
      // 如果指定了Agent，直接从该Agent获取客户端
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      const client = agentInstance.getMCPClient(name);
      if (!client) {
        throw new Error(`MCP client "${name}" not found in agent "${agentName}"`);
      }
      
      return await client.callTool(functionName, args);
    } else {
      // 如果未指定Agent，自动查找
      const result = await findAgentByMcpClient(name);
      if (!result) {
        throw new Error(`MCP client "${name}" not found in any agent`);
      }
      
      const client = result.agentInstance.getMCPClient(name);
      return await client.callTool(functionName, args);
    }
  },

  /**
   * 调用指定工作区的 MCP 客户端工具函数 - Agent-centered版本
   * 现在delegated到mcpCallTool方法
   * @deprecated 建议直接使用mcpCallTool方法并指定agentName
   */
  async mcpCallToolWithWorkspace({
    workspacePath,
    name,
    functionName,
    args,
    abortController,
    agentName
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
    abortController?: AbortController;
    agentName?: string;
  }) {
    // Delegate to the updated mcpCallTool method
    return await this.mcpCallTool({
      name,
      functionName,
      args,
      agentName
    });
  },

  /**
   * 获取指定 MCP 客户端的资源内容 - Agent-centered版本
   * 用于访问 MCP 服务提供的各种资源（如文件内容、数据等）
   * @param name MCP客户端名称
   * @param uri 资源URI（格式由具体MCP服务定义）
   * @param agentName 可选的Agent名称，如果未指定则自动查找
   * @returns 资源的内容数据
   * @throws 如果指定的MCP客户端不存在或资源访问失败
   */
  async mcpCallResource({
    name,
    uri,
    agentName
  }: {
    name: string;
    uri: string;
    agentName?: string;
  }) {
    if (agentName) {
      // 如果指定了Agent，直接从该Agent获取客户端
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      const client = agentInstance.getMCPClient(name);
      if (!client) {
        throw new Error(`MCP client "${name}" not found in agent "${agentName}"`);
      }
      
      return await client.callResource(uri);
    } else {
      // 如果未指定Agent，自动查找
      const result = await findAgentByMcpClient(name);
      if (!result) {
        throw new Error(`MCP client "${name}" not found in any agent`);
      }
      
      const client = result.agentInstance.getMCPClient(name);
      return await client.callResource(uri);
    }
  },

  /**
   * 获取指定工作区的 MCP 客户端资源内容 - Agent-centered版本
   * @deprecated 建议直接使用mcpCallResource方法并指定agentName
   */
  async mcpCallResourceWithWorkspace({
    workspacePath,
    name,
    uri,
    agentName
  }: {
    workspacePath: string;
    name: string;
    uri: string;
    agentName?: string;
  }) {
    // Delegate to the updated mcpCallResource method
    return await this.mcpCallResource({
      name,
      uri,
      agentName
    });
  },

  /**
   * 调用指定 MCP 客户端的提示模板 - Agent-centered版本
   * 用于获取预定义的提示内容，通常用于AI对话或任务执行
   * @param name MCP客户端名称
   * @param functionName 提示模板函数名称
   * @param args 传递给提示模板的参数
   * @param agentName 可选的Agent名称，如果未指定则自动查找
   * @returns 渲染后的提示内容
   * @throws 如果指定的MCP客户端不存在或提示调用失败
   */
  async mcpCallPrompt({
    name,
    functionName,
    args,
    agentName
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
    agentName?: string;
  }) {
    if (agentName) {
      // 如果指定了Agent，直接从该Agent获取客户端
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      const client = agentInstance.getMCPClient(name);
      if (!client) {
        throw new Error(`MCP client "${name}" not found in agent "${agentName}"`);
      }
      
      return await client.callPrompt(functionName, args);
    } else {
      // 如果未指定Agent，自动查找
      const result = await findAgentByMcpClient(name);
      if (!result) {
        throw new Error(`MCP client "${name}" not found in any agent`);
      }
      
      const client = result.agentInstance.getMCPClient(name);
      return await client.callPrompt(functionName, args);
    }
  },

  /**
   * 调用指定工作区的 MCP 客户端提示模板 - Agent-centered版本
   * @deprecated 建议直接使用mcpCallPrompt方法并指定agentName
   */
  async mcpCallPromptWithWorkspace({
    workspacePath,
    name,
    functionName,
    args,
    agentName
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
    agentName?: string;
  }) {
    // Delegate to the updated mcpCallPrompt method
    return await this.mcpCallPrompt({
      name,
      functionName,
      args,
      agentName
    });
  },

  /**
   * 启动工作区 MCP 服务 - Agent-centered版本
   * 启动所有Agent的MCP客户端
   */
  async startWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      await this.startAllAgentMcpClients();
      return await this.getWorkspaceMcpClients();
    } catch (error) {
      console.error('Failed to start workspace MCP clients:', error);
      throw error;
    }
  },

  /**
   * 强制重新加载工作区MCP配置 - Agent-centered版本
   * 重新加载所有Agent的MCP客户端
   */
  async forceReloadWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      // 重新加载所有Agent的MCP客户端
      await this.stopAllAgentMcpClients();
      await this.startAllAgentMcpClients();
      return await this.getWorkspaceMcpClients();
    } catch (error) {
      console.error('Failed to force reload workspace MCP clients:', error);
      throw error;
    }
  },


  /**
   * 添加或更新 MCP 服务器配置 - Agent-centered版本
   * @deprecated 建议使用setAgentMcpServerConfig方法
   */
  async setWorkspaceMcpServerConfig({
    serverName,
    serverConfig,
    agentName
  }: {
    serverName: string;
    serverConfig: MCPServerConfig;
    agentName?: string; // 需要指定Agent名称
  }): Promise<void> {
    if (!agentName) {
      throw new Error('Agent-centered架构要求指定agentName');
    }
    
    return await this.setAgentMcpServerConfig({
      agentName,
      serverName,
      serverConfig
    });
  },

  /**
   * 删除 MCP 服务器配置 - Agent-centered版本
   * @deprecated 建议使用deleteAgentMcpServerConfig方法
   */
  async deleteWorkspaceMcpServerConfig({
    serverName,
    agentName
  }: {
    serverName: string;
    agentName?: string; // 需要指定Agent名称
  }): Promise<void> {
    if (!agentName) {
      throw new Error('Agent-centered架构要求指定agentName');
    }
    
    return await this.deleteAgentMcpServerConfig({
      agentName,
      serverName
    });
  },



  /**
   * 获取工作区 MCP 客户端 - Agent-centered版本
   * 聚合所有Agent的MCP客户端
   */
  async getWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      return await getAllMcpClients();
    } catch (error) {
      console.error("Failed to get workspace MCP clients:", error);
      return [];
    }
  },

  /**
   * 根据Agent获取MCP客户端
   */
  async getMcpClientsByAgent(agentName: string): Promise<Record<string, unknown>[]> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      
      if (!agentInstance) {
        return [];
      }
      
      const clients = agentInstance.getMCPClients();
      return clients.map(client => ({
        ...client.toJSON(),
        agentName: agentName,
      }));
    } catch (error) {
      console.error(`Failed to get MCP clients for agent ${agentName}:`, error);
      return [];
    }
  },

  /**
   * 为指定Agent设置MCP服务器配置
   */
  async setAgentMcpServerConfig({
    agentName,
    serverName,
    serverConfig
  }: {
    agentName: string;
    serverName: string;
    serverConfig: MCPServerConfig;
  }): Promise<void> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      await agentInstance.setMCPServerConfig(serverName, serverConfig);
    } catch (error) {
      console.error(`Failed to set MCP server config for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 删除指定Agent的MCP服务器配置
   */
  async deleteAgentMcpServerConfig({
    agentName,
    serverName
  }: {
    agentName: string;
    serverName: string;
  }): Promise<void> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      await agentInstance.deleteMCPServerConfig(serverName);
    } catch (error) {
      console.error(`Failed to delete MCP server config for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 重启指定Agent的MCP客户端
   */
  async restartAgentMcpClient({
    agentName,
    clientName
  }: {
    agentName: string;
    clientName: string;
  }): Promise<void> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agentInstance = workspace.getAgentInstance(agentName);
      
      if (!agentInstance) {
        throw new Error(`Agent "${agentName}" not found`);
      }
      
      await agentInstance.restartMCPClient(clientName);
    } catch (error) {
      console.error(`Failed to restart MCP client ${clientName} for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 启动所有Agent的MCP客户端
   */
  async startAllAgentMcpClients(): Promise<void> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agents = await workspace.getAllAgents();
      
      for (const agentConfig of agents) {
        const agentInstance = workspace.getAgentInstance(agentConfig.name);
        if (agentInstance) {
          try {
            await agentInstance.startMCPClients();
          } catch (error) {
            console.warn(`Failed to start MCP clients for agent ${agentConfig.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to start all agent MCP clients:", error);
      throw error;
    }
  },

  /**
   * 停止所有Agent的MCP客户端
   */
  async stopAllAgentMcpClients(): Promise<void> {
    try {
      const workspace = workspaceManager.getCurrentWorkspace();
      const agents = await workspace.getAllAgents();
      
      for (const agentConfig of agents) {
        const agentInstance = workspace.getAgentInstance(agentConfig.name);
        if (agentInstance) {
          try {
            await agentInstance.stopMCPClients();
          } catch (error) {
            console.warn(`Failed to stop MCP clients for agent ${agentConfig.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to stop all agent MCP clients:", error);
      throw error;
    }
  }

};