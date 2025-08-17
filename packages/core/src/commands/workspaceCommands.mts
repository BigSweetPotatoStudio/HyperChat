import { zx } from "../es6.mjs";
const { fs, path } = zx;
import { DirectoryItem } from "@dadigua/hyperchat-shared";
import { getWorkspaceManager } from "../workspace/index.mjs";

/**
 * 工作区管理相关命令
 * 包含工作区创建、切换、配置、文件树等功能
 */
export const workspaceCommands = {

  // /**
  //  * 打开已存在的工作区
  //  * 检查指定目录是否已经是工作区，如果是则直接加载
  //  * @param workspacePath 工作区根目录的绝对路径
  //  * @returns 工作区配置信息，如果不是工作区则返回null
  //  */
  // async openWorkspace({
  //   workspacePath,
  //   force
  // }: {
  //   workspacePath: string;
  //   force: boolean; // 是否强制打开工作区，即使不是工作区目录
  // }): Promise<Record<string, unknown> | null> {
  //   const workspaceManager = getWorkspaceManager();

  //   await workspaceManager.switchWorkspace(workspacePath, force);
  //   // 加载现有工作区
  //   const workspace = workspaceManager.getCurrentWorkspace();
  //   return workspace ? workspace.getConfig() : null;
  // },

  // /**
  //  * 创建或初始化新的工作区
  //  * 在指定目录中创建 .hyperchat 配置文件夹和必要的配置文件
  //  * @param workspacePath 工作区根目录的绝对路径
  //  * @param name 工作区显示名称，默认使用目录名
  //  * @param description 工作区描述信息
  //  * @returns 新创建的工作区配置信息
  //  */
  // async createWorkspace({
  //   workspacePath,
  //   name,
  //   description
  // }: {
  //   workspacePath: string;
  //   name?: string;
  //   description?: string;
  // }): Promise<Record<string, unknown>> {
  //   const workspaceManager = getWorkspaceManager();

  //   // 如果没有提供名称，从路径提取文件夹名称作为默认名称
  //   const workspaceName = name || path.basename(workspacePath) || 'Workspace';

  //   const workspace = await workspaceManager.createWorkspace(workspacePath, workspaceName, description);
  //   return workspace.getConfig();
  // },

  /**
   * 获取当前工作区（无参数版本，新架构）
   * @returns 当前工作区的配置信息
   */
  async getCurrentWorkspace() {
    const workspaceManager = getWorkspaceManager();
    await workspaceManager.initialize(process.cwd());
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) return null;

    const config = workspace.getConfig();
    const summary = await workspace.getSummary();
    const workspacePath = workspaceManager.getCurrentWorkspace().workspacePath;
    const isGlobal = workspaceManager.isGlobalWorkspace(workspacePath);

    return {
      ...config,
      path: workspacePath,
      isGlobal,
      agentsCount: summary.agentsCount,
      // 在Agent-centered架构中不再有工作区级别的MCP服务器数量
      // 工作区设置已移除，使用默认设置
      settings: {
        defaultAgent: undefined
      }
    };
  },

  /**
   * 获取全局工作区路径
   * @returns 全局工作区路径
   */
  async getGlobalWorkspacePath() {
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.getGlobalWorkspacePath();
  },

  /**
   * 获取工作区完整文件树（已废弃，建议使用 getWorkspaceDirectoryList 实现懒加载）
   * 这个方法会一次性加载整个目录树，对于大型项目可能导致性能问题
   * @returns 完整的文件树结构，如果工作区不存在则返回null
   * @deprecated 推荐使用 getWorkspaceDirectoryList 方法实现懒加载
   */
  async getWorkspaceFileTree() {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) return null;

    // 更新文件树，排除常见的构建产物目录
    await workspace.updateFileTree({
      includeHidden: false,
      maxDepth: 5,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
    });
    return workspace.getFileTree();
  },

  /**
   * 获取工作区指定目录的直接子项列表（懒加载方式）
   * 仅加载指定目录的直接子项，不递归加载所有子目录，适合大型项目
   * @param directoryPath 相对于工作区的目录路径，默认为根目录
   * @returns 目录项目列表，包含文件名、类型、大小、修改时间等信息
   */
  async getWorkspaceDirectoryList({
    workspacePath,
    directoryPath = ""
  }: {
    workspacePath?: string;
    directoryPath?: string;
  } = {}) {
    const { fs, path } = zx;

    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;

      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
      }

      if (!workspace) return [];

      // 确保工作区已初始化
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }

      // 获取当前工作区路径
      const workingDir = workspace.workspacePath;

      // 构建完整路径
      const fullPath = directoryPath
        ? path.join(workingDir, directoryPath)
        : workingDir;

      // 检查路径是否存在且是目录
      if (!fs.existsSync(fullPath)) {
        return [];
      }

      const stats = await fs.promises.stat(fullPath);
      if (!stats.isDirectory()) {
        return [];
      }

      // 读取目录内容
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });

      const result: DirectoryItem[] = [];

      for (const entry of entries) {
        const isHidden = entry.name.startsWith('.');
        const isExcluded = ['node_modules', '.git', 'dist', 'build'].includes(entry.name);

        // 跳过排除的目录
        if (isExcluded) {
          continue;
        }

        const itemPath = path.join(fullPath, entry.name);
        const relativePath = directoryPath
          ? path.join(directoryPath, entry.name).replace(/\\/g, '/')
          : entry.name;

        try {
          const itemStats = await fs.promises.stat(itemPath);

          result.push({
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? itemStats.size : undefined,
            modified: itemStats.mtime.getTime(),
            extension: entry.isFile() ? path.extname(entry.name).toLowerCase() : undefined,
            isLeaf: !entry.isDirectory(),
            isHidden: isHidden,
          });
        } catch (error) {
          // 忽略无法访问的文件
          continue;
        }
      }

      // 排序：目录在前，文件在后，然后按名称排序
      result.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch (error) {
      console.error("Failed to list workspace directory:", error);
      return [];
    }
  },

  /**
   * 检查目录是否为工作区
   */
  async isWorkspaceDirectory({
    directoryPath
  }: {
    directoryPath: string;
  }): Promise<boolean> {
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.isWorkspaceDirectory(directoryPath);
  },

  /**
   * 获取所有已加载的工作区列表
   * @returns 工作区列表
   */
  async getAllWorkspaces(): Promise<Array<{
    path: string;
    isPrimary: boolean;
    isInitialized: boolean;
    isStarted: boolean;
  }>> {
    try {
      const workspaceManager = getWorkspaceManager();
      const currentPath = workspaceManager.getCurrentWorkspace().workspacePath;
      const allWorkspaces = workspaceManager.getAll();

      return allWorkspaces.map(({ path, workspace }) => ({
        path,
        isPrimary: path === currentPath,
        isInitialized: workspace.isInitialized(),
        isStarted: workspace.isStarted()
      }));
    } catch (error) {
      console.error("Failed to get all workspaces:", error);
      return [];
    }
  },

  /**
   * 切换到指定工作区
   * @param workspacePath 工作区路径
   * @returns 切换结果
   */
  async switchWorkspace({
    workspacePath,
    force
  }: {
    workspacePath: string;
    force: boolean; // 是否强制切换工作区，即使当前工作区有未保存的更改
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      await workspaceManager.switchWorkspace(workspacePath, force);
      return true;
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      throw error;
    }
  },

  /**
   * 添加新工作区到管理器中（多工作区支持）
   * @param workspacePath 工作区路径
   * @param forceCreate 如果不是工作区目录，是否强制创建
   * @returns 添加的工作区信息
   */
  async addWorkspace({
    workspacePath,
    forceCreate = false
  }: {
    workspacePath: string;
    forceCreate?: boolean;
  }): Promise<{
    path: string;
    name: string;
    isGlobal: boolean;
    isInitialized: boolean;
    isStarted: boolean;
    isPrimary: boolean;
  }> {
    try {
      const workspaceManager = getWorkspaceManager();

      // 创建工作区实例
      const workspace = await workspaceManager.create(workspacePath, forceCreate);

      // 初始化工作区
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }
      if (!workspace.isStarted()) {
        await workspace.start();
      }

      // 获取工作区信息
      const config = workspace.getConfig();
      const isGlobal = workspaceManager.isGlobalWorkspace(workspacePath);

      return {
        path: workspacePath,
        name: config.name || (isGlobal ? 'Global Workspace' : 'Workspace'),
        isGlobal,
        isPrimary: false,
        isInitialized: workspace.isInitialized(),
        isStarted: workspace.isStarted()
      };
    } catch (error) {
      console.error("Failed to add workspace:", error);
      throw error;
    }
  },

  /**
   * 获取指定工作区的详细信息（多工作区支持）
   * @param workspacePath 工作区路径
   * @returns 工作区详细信息
   */
  async getWorkspaceInfo({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<{
    path: string;
    name: string;
    description?: string;
    created: number;
    agentsCount: number;
    isGlobal: boolean;
    isInitialized: boolean;
    isStarted: boolean;
    isPrimary: boolean;
  } | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = await workspaceManager.get(workspacePath, true);

      if (!workspace) {
        return null;
      }

      // 确保工作区已初始化
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }

      const config = workspace.getConfig();
      const summary = await workspace.getSummary();
      const isGlobal = workspaceManager.isGlobalWorkspace(workspacePath);

      return {
        path: workspacePath,
        name: config.name || (isGlobal ? 'Global Workspace' : 'Workspace'),
        description: config.description,
        created: config.created || Date.now(),
        agentsCount: summary.agentsCount,
        isGlobal,
        isInitialized: workspace.isInitialized(),
        isStarted: workspace.isStarted(),
        isPrimary: workspacePath == workspaceManager.getCurrentWorkspace().workspacePath
      };
    } catch (error) {
      console.error("Failed to get workspace info:", error);
      throw error;
    }
  },

  /**
   * 从缓存中移除工作区
   * @param workspacePath 工作区路径
   * @returns 移除结果
   */
  async removeWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      // 不能移除主工作区
      const currentPath = workspaceManager.getCurrentWorkspace().workspacePath;
      if (workspacePath === currentPath) {
        throw new Error("Cannot remove current workspace");
      }
      return await workspaceManager.remove(workspacePath);
    } catch (error) {
      console.error("Failed to remove workspace:", error);
      throw error;
    }
  },

  /**
   * 获取指定工作区的 Agent 摘要信息（多工作区支持）
   * @param workspacePath 工作区路径，如果不提供则使用当前工作区
   */
  async getWorkspaceAgentsSummary({
    workspacePath
  }: {
    workspacePath?: string;
  } = {}): Promise<Array<{
    config: any;
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;

      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
      }

      // 确保工作区已初始化
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }

      // 通过工作区获取所有 Agent 摘要信息
      return await workspace.getAllAgentsSummary();
    } catch (error) {
      console.error("Failed to get workspace agents summary:", error);
      return [];
    }
  },

  /**
   * 获取指定工作区的 MCP 客户端列表（多工作区支持）
   * @param workspacePath 工作区路径，如果不提供则使用当前工作区
   */
  async getWorkspaceMcpClients({
    workspacePath
  }: {
    workspacePath?: string;
  } = {}): Promise<any[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;

      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
      }

      // 确保工作区已初始化
      if (!workspace.isInitialized()) {
        await workspace.initialize();
      }

      return workspace.getMcpClients();
    } catch (error) {
      console.error("Failed to get workspace MCP clients:", error);
      return [];
    }
  },


  /**
   * 读取工作区内指定文件的内容
   */
  async readWorkspaceFile({ filePath }: { filePath: string }): Promise<string> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 获取当前工作目录
      const currentWorkingDirectory = workspace.workspacePath;

      // 构建完整的文件路径，确保安全性
      const fullPath = path.resolve(currentWorkingDirectory, filePath);

      // 检查文件路径是否在当前工作目录范围内（防止路径遍历攻击）
      if (!fullPath.startsWith(path.resolve(currentWorkingDirectory))) {
        throw new Error(`文件路径超出当前工作目录范围: ${filePath}`);
      }

      // 检查文件是否存在
      if (!await fs.existsSync(fullPath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 检查是否为文件（不是目录）
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error(`指定路径不是文件: ${filePath}`);
      }

      // 读取文件内容
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Failed to read workspace file ${filePath}:`, error);
      throw error;
    }
  },

  /**
   * 写入内容到工作区内指定文件
   */
  async writeWorkspaceFile({ filePath, content }: { filePath: string, content: string }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 获取当前工作目录
      const currentWorkingDirectory = workspace.workspacePath;

      // 构建完整的文件路径，确保安全性
      const fullPath = path.resolve(currentWorkingDirectory, filePath);

      // 检查文件路径是否在当前工作目录范围内（防止路径遍历攻击）
      if (!fullPath.startsWith(path.resolve(currentWorkingDirectory))) {
        throw new Error(`文件路径超出当前工作目录范围: ${filePath}`);
      }

      // 确保目录存在
      const dirPath = path.dirname(fullPath);
      await fs.ensureDir(dirPath);

      // 写入文件内容
      await fs.writeFile(fullPath, content, 'utf8');

      console.log(`Successfully wrote file ${filePath} in current workspace`);
    } catch (error) {
      console.error(`Failed to write workspace file ${filePath}:`, error);
      throw error;
    }
  }

};