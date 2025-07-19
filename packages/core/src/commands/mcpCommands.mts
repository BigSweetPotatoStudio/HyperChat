import { MCPServerConfig, IMCPClient } from "@dadigua/hyperchat-shared/types";
import { getWorkspaceManager, workspaceManager } from "../workspace/index.mjs";

/**
 * MCP 管理相关命令
 * 包含 MCP 客户端管理、工具调用、资源管理等功能
 */
export const mcpCommands = {

  /**
   * 强制重新加载全局MCP配置文件
   * 停止所有全局MCP客户端，重新读取配置文件，然后重新启动
   * 用于在配置文件被外部修改时同步更新
   * @returns 返回重新加载后的客户端列表
   */
  async forceReloadMcpClients() {
    try {
      // 委托给工作区特定的重新加载方法
      return await this.forceReloadWorkspaceMcpClients();
    } catch (error) {
      console.error("Failed to force reload MCP clients:", error);
      throw error;
    }
  },

  /**
   * 在指定工作区中启动或重启 MCP 客户端
   * 适用于所有工作区（包括全局工作区）
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
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      if (clientConfig) {
        // 如果提供了配置，先设置配置再启动
        await workspace.setMcpServer(clientName, clientConfig);
      } else {
        // 如果没有配置，尝试重启现有客户端
        await workspace.manageMcpClient(clientName, 'restart');
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
   * 管理指定工作区的 MCP 客户端生命周期
   * 这是推荐的统一客户端管理方法，支持所有工作区（包括全局）
   * @param clientName MCP客户端名称
   * @param action 操作类型：
   *   - 'restart': 重启客户端（先停止再启动）
   *   - 'disable': 停止客户端服务并标记为禁用，保留配置
   *   - 'enable': 删除禁用标记并启动客户端
   *   - 'delete': 永久删除客户端配置并停止服务
   * @param scope 操作范围：
   *   - 'workspace': 操作工作区配置（默认）
   *   - 'global': 操作全局配置
   * @returns 操作结果
   */
  async manageWorkspaceMcpClient({
    clientName,
    action,
    scope = "workspace"
  }: {
    clientName: string;
    action: 'restart' | 'disable' | 'enable' | 'delete';
    scope?: "workspace" | "global";
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      await workspace.manageMcpClient(clientName, action, scope);

      return {
        success: true,
        action,
        clientName,
        scope
      };
    } catch (error) {
      console.error(`Failed to ${action} MCP client ${clientName} in ${scope}:`, error);
      throw error;
    }
  },

  /**
   * 调用指定 MCP 客户端的工具函数
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
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getCurrentWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 执行工具调用并返回结果
    return await client.callTool(functionName, args);
  },

  /**
   * 调用指定工作区的 MCP 客户端工具函数
   * 用于执行指定工作区中 MCP 服务提供的各种功能（如文件操作、系统调用等）
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称（如 hyper_tools、knowledge_base 等）
   * @param functionName 要调用的工具函数名称
   * @param args 传递给工具函数的参数对象
   * @returns 工具函数的执行结果
   * @throws 如果指定的MCP客户端不存在或工具调用失败
   */
  async mcpCallToolWithWorkspace({
    workspacePath,
    name,
    functionName,
    args
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 执行工具调用并返回结果
    return await client.callTool(functionName, args);
  },

  /**
   * 获取指定 MCP 客户端的资源内容
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
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getCurrentWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 获取指定URI的资源内容
    return await client.callResource(uri);
  },

  /**
   * 获取指定工作区的 MCP 客户端资源内容
   * 用于访问指定工作区中 MCP 服务提供的各种资源（如文件内容、数据等）
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称
   * @param uri 资源URI（格式由具体MCP服务定义）
   * @returns 资源的内容数据
   * @throws 如果指定的MCP客户端不存在或资源访问失败
   */
  async mcpCallResourceWithWorkspace({
    workspacePath,
    name,
    uri
  }: {
    workspacePath: string;
    name: string;
    uri: string;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 获取指定URI的资源内容
    return await client.callResource(uri);
  },

  /**
   * 调用指定 MCP 客户端的提示模板
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
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getCurrentWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 调用提示模板并返回渲染结果
    return await client.callPrompt(functionName, args);
  },

  /**
   * 调用指定工作区的 MCP 客户端提示模板
   * 用于获取指定工作区中预定义的提示内容，通常用于AI对话或任务执行
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称
   * @param functionName 提示模板函数名称
   * @param args 传递给提示模板的参数
   * @returns 渲染后的提示内容
   * @throws 如果指定的MCP客户端不存在或提示调用失败
   */
  async mcpCallPromptWithWorkspace({
    workspacePath,
    name,
    functionName,
    args
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 调用提示模板并返回渲染结果
    return await client.callPrompt(functionName, args);
  },

  /**
   * 启动工作区 MCP 服务
   */
  async startWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const clients = await workspace.startMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error('Failed to start workspace MCP clients:', error);
      throw error;
    }
  },

  /**
   * 强制重新加载工作区MCP配置
   */
  async forceReloadWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 重新加载MCP客户端（会自动停止现有服务并重新启动）
      const clients = await workspace.reloadMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error('Failed to force reload workspace MCP clients:', error);
      throw error;
    }
  },


  /**
   * 添加或更新 MCP 服务器配置（支持全局和工作区）
   */
  async setWorkspaceMcpServerConfig({
    serverName,
    serverConfig,
    scope = "workspace"
  }: {
    serverName: string;
    serverConfig: MCPServerConfig;
    scope?: "workspace" | "global";
  }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      if (scope === "global") {
        await workspace.setGlobalMcpServer(serverName, serverConfig);
      } else {
        await workspace.setMcpServer(serverName, serverConfig);
      }
    } catch (error) {
      console.error(`Failed to set ${scope} MCP server config:`, error);
      throw error;
    }
  },

  /**
   * 删除 MCP 服务器配置（支持全局和工作区）
   */
  async deleteWorkspaceMcpServerConfig({
    serverName,
    scope = "workspace"
  }: {
    serverName: string;
    scope?: "workspace" | "global";
  }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      if (scope === "global") {
        await workspace.deleteGlobalMcpServer(serverName);
      } else {
        await workspace.deleteMcpServer(serverName);
      }
    } catch (error) {
      console.error(`Failed to delete ${scope} MCP server config:`, error);
      throw error;
    }
  },



  /**
   * 获取工作区 MCP 客户端
   */
  async getWorkspaceMcpClients(): Promise<IMCPClient[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        return [];
      }

      // 使用工作区实例方法获取客户端
      const clients = workspace.getMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error("Failed to get workspace MCP clients:", error);
      return [];
    }
  }

};