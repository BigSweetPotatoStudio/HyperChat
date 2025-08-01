import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { CONSTANTS } from "./constants.mjs";

import { DataList } from "./dataList.mjs";
import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig } from "@dadigua/hyperchat-shared";
import type { ChatHistoryItem } from "@dadigua/hyperchat-shared/types";
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import type { Task } from "@dadigua/hyperchat-shared";
import type { WorkspaceMCPConfig } from "./mcp/types.mjs";
import { AgentMCPManager } from "./agentMCPManager.mjs";
import { AgentTaskScheduler } from "./agentTaskScheduler.mjs";
import { TaskQueue } from "../utils/taskQueue.mjs";

/**
 * Agent 类 - 管理单个 Agent 的配置和聊天记录
 */
export class AgentInstance {
  private config: AgentConfig;
  private chatLogs: DataList<ChatHistoryItem> | null = null; // 延迟初始化
  private agentPath: string;
  private configPath: string;
  private mcpConfigPath: string;
  private tasksPath: string;
  private initialized: boolean = false;
  public mcpManager: AgentMCPManager; // Agent专属MCP管理器
  private taskScheduler: AgentTaskScheduler | null = null; // Agent专属任务调度器

  // 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
  private static chatLogQueue = new TaskQueue({ concurrency: 1 });
  constructor(agentPath: string, config?: AgentConfig) {
    this.agentPath = agentPath;
    this.configPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);
    this.mcpConfigPath = path.join(agentPath, CONSTANTS.CONFIG_FILES.MCP);
    this.tasksPath = path.join(agentPath, "tasks");

    this.config = config || {
      name: path.basename(agentPath),
      prompt: '',
      allowMCPs: [],
      isConfirmCallTool: false,
      maxTokens: 4000,
      tags: [],
      subAgents: [],
      version: 1,
    };

    this.mcpManager = new AgentMCPManager(
      this.agentPath,
      this.config.allowMCPs
    );
    // chatLogs 延迟初始化
  }

  /**
   * 初始化Agent（只在需要时才调用）
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return; // 已初始化，直接返回
    }

    // 创建目录结构
    await this.createDirectories();

    // 加载配置
    await this.loadConfig();

    // 初始化聊天记录管理器
    this.chatLogs = new DataList<ChatHistoryItem>(
      path.join(this.agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
      DataList.FileFormat.YAML
    );

    this.initialized = true;
  }

  /**
   * 创建目录结构
   */
  private async createDirectories(): Promise<void> {
    const directories = [
      this.agentPath,
      path.join(this.agentPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
      this.tasksPath, // Agent专属tasks目录
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * 加载 Agent 配置
   */
  private async loadConfig(): Promise<void> {
    // 确保 key 始终与文件夹名称保持一致
    const folderName = path.basename(this.agentPath);
    this.config.name = folderName;

    if (fs.existsSync(this.configPath)) {
      try {
        const content = await fs.promises.readFile(this.configPath, "utf-8");
        const config = yaml.load(content) as AgentConfig;

        // 合并配置
        this.config = { ...this.config, ...config };

        // 如果从配置文件读取的 name 为空，使用文件夹名称作为 name
        if (!this.config.name || this.config.name.trim() === '') {
          this.config.name = folderName;
        } else {
          // 清理名称中的scope前缀，确保名称与文件夹名称一致
          const cleanName = this.config.name.replace(/^(global|workspace):/, '');
          this.config.name = cleanName || folderName;
        }
      } catch (error) {
        console.warn(`加载 Agent 配置失败 ${folderName}:`, error);
      }
    }
  }


  /**
   * 保存 Agent 配置
   */
  async saveConfig(): Promise<boolean> {
    try {
      const yamlContent = yaml.dump(this.config, { indent: 2 });
      await fs.promises.writeFile(this.configPath, yamlContent, "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存 Agent 配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 确保初始化（内部使用）
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * 获取Agent配置（无需初始化）
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * 获取Agent路径
   */
  getAgentPath(): string {
    return this.agentPath;
  }

  /**
   * 更新 Agent 配置
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<boolean> {
    const oldName = this.config.name;
    const newName = updates.name;
    const oldAllowMCPs = this.config.allowMCPs;

    // 如果名称发生变更，需要重命名文件夹
    if (newName && newName !== oldName) {
      const oldPath = this.agentPath;
      const parentPath = path.dirname(oldPath);
      const newPath = path.join(parentPath, sanitizeFileName(newName));

      // 检查新路径是否已存在
      if (fs.existsSync(newPath)) {
        throw new Error(`Agent 名称 "${newName}" 已存在，无法重命名`);
      }

      try {
        // 重命名文件夹
        await fs.promises.rename(oldPath, newPath);

        // 更新实例路径
        this.agentPath = newPath;
        this.configPath = path.join(newPath, CONSTANTS.CONFIG_FILES.AGENT_CONFIG);

        // 更新MCP和任务路径
        this.mcpConfigPath = path.join(newPath, CONSTANTS.CONFIG_FILES.MCP);
        this.tasksPath = path.join(newPath, "tasks");

        // 重置chatLogs（如果已初始化）
        if (this.initialized && this.chatLogs) {
          this.chatLogs = new DataList<ChatHistoryItem>(
            path.join(newPath, CONSTANTS.DIRECTORIES.CHAT_LOGS),
            DataList.FileFormat.YAML
          );
        }

      } catch (error) {
        console.error(`重命名 Agent 文件夹失败: ${oldName} -> ${newName}:`, error);
        throw new Error(`重命名 Agent 文件夹失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // 更新配置
    this.config = { ...this.config, ...updates };
    return await this.saveConfig();
  }

  /**
   * 获取所有聊天记录（使用分页，避免内存压力）
   */
  async getChatLogs(limit: number = 10): Promise<ChatHistoryItem[]> {
    await this.ensureInitialized();

    if (limit) {
      const result = await this.chatLogs!.getPage(0, limit);
      return result.items;
    }
    // 使用deprecated方法，会显示警告提示
    return await this.chatLogs!.getAll();
  }

  /**
   * 分页获取聊天记录
   */
  async getChatLogsPage(offset: number = 0, limit: number = 10): Promise<{ items: ChatHistoryItem[]; total: number; hasMore: boolean }> {
    await this.ensureInitialized();
    return await this.chatLogs!.getPage(offset, limit);
  }

  /**
   * 获取单个聊天记录
   */
  async getChatLog(key: string): Promise<ChatHistoryItem | null> {
    await this.ensureInitialized();
    return await this.chatLogs!.get(key);
  }

  /**
   * 添加或更新聊天记录
   */
  async setChatLog(chatLog: ChatHistoryItem): Promise<boolean> {
    await this.ensureInitialized();
    // 确保聊天记录与当前Agent关联
    chatLog.agentName = this.config.name;

    // 使用TaskQueue确保顺序写入，避免YAML文件并发问题
    return await AgentInstance.chatLogQueue.add(async () => {
      return await this.chatLogs!.set(chatLog);
    });
  }

  /**
   * 删除聊天记录
   */
  async deleteChatLog(key: string): Promise<boolean> {
    await this.ensureInitialized();
    return await this.chatLogs!.delete(key);
  }

  /**
   * 清空所有聊天记录
   */
  async clearChatLogs(): Promise<boolean> {
    await this.ensureInitialized();
    return await this.chatLogs!.clear();
  }

  /**
   * 获取聊天记录数量
   */
  async getChatLogsCount(): Promise<number> {
    await this.ensureInitialized();
    return await this.chatLogs!.size();
  }

  /**
   * 检查 Agent 是否存在
   */
  exists(): boolean {
    return fs.existsSync(this.agentPath) && fs.existsSync(this.configPath);
  }

  /**
   * 删除整个 Agent（包括专属的MCP和任务配置）
   */
  async delete(): Promise<boolean> {
    try {
      // 先停止任务调度器
      await this.stopTaskScheduler();

      // 停止MCP客户端
      await this.stopMCPClients();

      // 清理管理器
      if (this.taskScheduler) {
        await this.taskScheduler.stop();
        this.taskScheduler = null;
      }

      if (this.mcpManager) {
        await this.mcpManager.destroy();
      }

      if (fs.existsSync(this.agentPath)) {
        // 递归删除整个Agent目录，包括:
        // - agent.yaml (Agent配置)
        // - memory.md (Agent记忆)
        // - chatlogs/ (聊天记录)
        // - mcp.json (Agent专属MCP配置)
        // - tasks/ (Agent专属任务目录)
        await fs.promises.rm(this.agentPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.warn(`删除 Agent 失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 获取 Agent 摘要信息（包含MCP和任务统计）
   */
  async getSummary(): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
    hasMCPConfig: boolean;
    tasksCount: number;
    taskScheduler?: {
      running: boolean;
      scheduledTasksCount: number;
      scheduledTasks: string[];
    };
  }> {
    // 使用轻量级统计避免加载所有聊天记录内容
    await this.ensureInitialized();
    const stats = await this.chatLogs!.getStats();

    return {
      config: this.config,
      chatLogsCount: stats.count,
      lastChatTime: stats.lastModified,
      hasMCPConfig: await this.hasMCPConfig(),
      tasksCount: await this.getTasksCount(),
      taskScheduler: this.getTaskSchedulerStats(),
    };
  }

  // ==================== Agent专属MCP管理 ====================

  /**
   * 获取Agent专属MCP配置路径
   */
  getMCPConfigPath(): string {
    return this.mcpConfigPath;
  }

  /**
   * 检查Agent是否有MCP配置
   */
  async hasMCPConfig(): Promise<boolean> {
    return fs.existsSync(this.mcpConfigPath);
  }

  /**
   * 获取Agent专属MCP配置
   */
  async getMCPConfig(): Promise<WorkspaceMCPConfig | null> {
    if (!await this.hasMCPConfig()) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(this.mcpConfigPath, "utf-8");
      const config = JSON.parse(content) as WorkspaceMCPConfig;
      return config;
    } catch (error) {
      console.warn(`读取Agent MCP配置失败 ${this.config.name}:`, error);
      return null;
    }
  }

  /**
   * 更新Agent专属MCP配置
   */
  async updateMCPConfig(config: WorkspaceMCPConfig): Promise<boolean> {
    try {
      // 确保Agent目录存在
      if (!fs.existsSync(this.agentPath)) {
        await fs.promises.mkdir(this.agentPath, { recursive: true });
      }

      // 更新配置的基本信息
      const updatedConfig: WorkspaceMCPConfig = {
        ...config,
        workspacePath: this.agentPath,
      };

      const content = JSON.stringify(updatedConfig, null, 2);
      await fs.promises.writeFile(this.mcpConfigPath, content, "utf-8");
      return true;
    } catch (error) {
      console.warn(`保存Agent MCP配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 删除Agent专属MCP配置
   */
  async deleteMCPConfig(): Promise<boolean> {
    try {
      if (await this.hasMCPConfig()) {
        await fs.promises.unlink(this.mcpConfigPath);
      }
      return true;
    } catch (error) {
      console.warn(`删除Agent MCP配置失败 ${this.config.name}:`, error);
      return false;
    }
  }

  // ==================== Agent专属MCP客户端管理 ====================



  /**
   * 启动Agent专属MCP客户端
   */
  async startMCPClients(): Promise<void> {
    const mcpManager = this.mcpManager;
    await mcpManager.startClients();
  }

  /**
   * 停止Agent专属MCP客户端
   */
  async stopMCPClients(): Promise<void> {
    if (this.mcpManager) {
      await this.mcpManager.stopClients();
    }
  }

  /**
   * 获取Agent的MCP客户端列表
   */
  getMCPClients() {
    return this.mcpManager ? this.mcpManager.getClients() : [];
  }

  /**
   * 获取指定MCP客户端
   */
  getMCPClient(name: string) {
    return this.mcpManager ? this.mcpManager.getClient(name) : undefined;
  }

  /**
   * 重启指定MCP客户端
   */
  async restartMCPClient(name: string): Promise<void> {
    const mcpManager = this.mcpManager;
    await mcpManager.restartClient(name);
  }

  /**
   * 设置MCP服务器配置
   */
  async setMCPServerConfig(name: string, serverConfig: MCPServerConfig): Promise<void> {
    const mcpManager = this.mcpManager;
    await mcpManager.setServerConfig(name, serverConfig);
  }

  /**
   * 删除MCP服务器配置
   */
  async deleteMCPServerConfig(name: string): Promise<void> {
    const mcpManager = this.mcpManager;
    await mcpManager.deleteServerConfig(name);
  }

  /**
   * 获取Agent允许的MCP工具
   * 封装了过滤逻辑，返回Agent配置中允许的工具列表
   */
  getMCPTools(): {
    allowedMCPsCount: number;
    availableTools: any[];
    matchedTools: any[];
    totalTools: number;
  } {
    const mcpClients = this.getMCPClients();
    const agentConfig = this.getConfig();

    // 获取所有可用工具
    const availableTools = mcpClients.flatMap((client: any) => client.tools || []);
    const totalTools = availableTools.length;

    // 计算允许的MCP配置数量（去重）
    const allowedMCPsCount = new Set(agentConfig.allowMCPs.map(x => x.split(" > ")[0])).size;

    // 如果Agent有特定的allowMCPs配置，过滤工具
    let matchedTools: any[] = [];
    if (agentConfig.allowMCPs && agentConfig.allowMCPs.length > 0) {
      const allowedMCPs = agentConfig.allowMCPs;
      matchedTools = availableTools.filter((tool: any) =>
        allowedMCPs.some(allowed =>
          tool.name === allowed ||
          tool.displayName === allowed ||
          tool.originalName === allowed ||
          tool.clientName === allowed
        )
      );
    } else {
      // 如果没有特定配置，则所有工具都可用
      matchedTools = availableTools;
    }

    return {
      allowedMCPsCount,
      availableTools,
      matchedTools,
      totalTools,
    };
  }

  /**
   * 调用MCP工具
   * 替代废弃的Command.mcpCallToolWithWorkspace方法
   */
  async callTool(
    toolName: string,
    functionName: string,
    args: any = {},
    abortController?: AbortController
  ): Promise<any> {
    // 获取对应的MCP客户端
    const mcpClients = this.getMCPClients();
    const client = mcpClients.find((client: any) => client.serverName === toolName);

    if (!client) {
      throw new Error(`MCP client "${toolName}" not found in agent "${this.config.name}"`);
    }

    if (client.status !== 'connected') {
      throw new Error(`MCP client "${toolName}" is not connected (status: ${client.status})`);
    }

    try {
      // 调用MCP客户端的工具
      const result = await client.callTool(
        functionName,
        args,
        abortController
      );

      return result;
    } catch (error) {
      console.error(`Agent ${this.config.name} MCP工具调用失败 [${toolName}:${functionName}]:`, error);
      throw error;
    }
  }

  // ==================== Agent专属任务管理 ====================

  /**
   * 获取Agent专属任务目录路径
   */
  getTasksPath(): string {
    return this.tasksPath;
  }

  /**
   * 检查Agent是否有任务目录
   */
  async hasTasksDirectory(): Promise<boolean> {
    return fs.existsSync(this.tasksPath) && fs.statSync(this.tasksPath).isDirectory();
  }

  /**
   * 获取Agent专属任务列表
   */
  async getTasks(): Promise<Task[]> {
    if (!await this.hasTasksDirectory()) {
      return [];
    }

    try {
      const files = await fs.promises.readdir(this.tasksPath);
      const taskFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      const tasks: Task[] = [];

      for (const file of taskFiles) {
        try {
          const filePath = path.join(this.tasksPath, file);
          const content = await fs.promises.readFile(filePath, "utf-8");
          const task = yaml.load(content) as Task;

          // 确保任务的agentName与当前Agent一致
          if (task && typeof task === 'object') {
            task.agentName = this.config.name;
            tasks.push(task);
          }
        } catch (error) {
          console.warn(`读取任务文件失败 ${file}:`, error);
        }
      }

      return tasks;
    } catch (error) {
      console.warn(`读取Agent任务列表失败 ${this.config.name}:`, error);
      return [];
    }
  }

  /**
   * 获取单个任务
   */
  async getTask(taskName: string): Promise<Task | null> {
    const taskPath = path.join(this.tasksPath, `${sanitizeFileName(taskName)}.yaml`);

    if (!fs.existsSync(taskPath)) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(taskPath, "utf-8");
      const task = yaml.load(content) as Task;

      if (task && typeof task === 'object') {
        // 确保任务的agentName与当前Agent一致
        task.agentName = this.config.name;
        return task;
      }

      return null;
    } catch (error) {
      console.warn(`读取任务失败 ${taskName}:`, error);
      return null;
    }
  }

  /**
   * 添加Agent专属任务
   */
  async addTask(task: Task): Promise<boolean> {
    try {
      // 确保tasks目录存在
      if (!await this.hasTasksDirectory()) {
        await fs.promises.mkdir(this.tasksPath, { recursive: true });
      }

      // 确保任务的agentName与当前Agent一致
      const agentTask: Task = {
        ...task,
        agentName: this.config.name,
      };

      const taskPath = path.join(this.tasksPath, `${sanitizeFileName(task.name)}.yaml`);
      const yamlContent = yaml.dump(agentTask, { indent: 2 });
      await fs.promises.writeFile(taskPath, yamlContent, "utf-8");

      // 更新任务调度
      if (!agentTask.disabled && agentTask.cron) {
        await this.updateTaskSchedule(agentTask.name, agentTask);
      }

      return true;
    } catch (error) {
      console.warn(`添加Agent任务失败 ${task.name}:`, error);
      return false;
    }
  }

  /**
   * 更新Agent专属任务
   */
  async updateTask(taskName: string, task: Task): Promise<boolean> {
    try {
      const oldTaskPath = path.join(this.tasksPath, `${sanitizeFileName(taskName)}.yaml`);
      const newTaskPath = path.join(this.tasksPath, `${sanitizeFileName(task.name)}.yaml`);

      // 确保任务的agentName与当前Agent一致
      const agentTask: Task = {
        ...task,
        agentName: this.config.name,
      };

      const yamlContent = yaml.dump(agentTask, { indent: 2 });

      // 如果任务名称发生变化，需要删除旧文件
      if (oldTaskPath !== newTaskPath && fs.existsSync(oldTaskPath)) {
        await fs.promises.unlink(oldTaskPath);
      }

      await fs.promises.writeFile(newTaskPath, yamlContent, "utf-8");

      // 更新任务调度
      const oldTaskNameForScheduler = taskName !== task.name ? taskName : undefined;
      await this.updateTaskSchedule(task.name, agentTask, oldTaskNameForScheduler);

      return true;
    } catch (error) {
      console.warn(`更新Agent任务失败 ${taskName}:`, error);
      return false;
    }
  }

  /**
   * 删除Agent专属任务
   */
  async deleteTask(taskName: string): Promise<boolean> {
    try {
      const taskPath = path.join(this.tasksPath, `${sanitizeFileName(taskName)}.yaml`);

      if (fs.existsSync(taskPath)) {
        await fs.promises.unlink(taskPath);
      }

      // 删除任务调度
      await this.deleteTaskSchedule(taskName);

      return true;
    } catch (error) {
      console.warn(`删除Agent任务失败 ${taskName}:`, error);
      return false;
    }
  }

  /**
   * 清空Agent的所有任务
   */
  async clearTasks(): Promise<boolean> {
    try {
      // 先停止任务调度器
      await this.stopTaskScheduler();

      if (await this.hasTasksDirectory()) {
        const files = await fs.promises.readdir(this.tasksPath);
        const taskFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

        for (const file of taskFiles) {
          const filePath = path.join(this.tasksPath, file);
          await fs.promises.unlink(filePath);
        }
      }
      return true;
    } catch (error) {
      console.warn(`清空Agent任务失败 ${this.config.name}:`, error);
      return false;
    }
  }

  /**
   * 获取Agent任务数量
   */
  async getTasksCount(): Promise<number> {
    const tasks = await this.getTasks();
    return tasks.length;
  }

  // ==================== Agent专属任务调度 ====================

  /**
   * 获取或创建Agent专属任务调度器
   */
  getTaskScheduler(): AgentTaskScheduler {
    if (!this.taskScheduler) {
      this.taskScheduler = new AgentTaskScheduler(
        this.config.name,
        () => this.getTasks(), // 获取任务列表的函数
        (taskName: string) => this.executeTaskInternal(taskName) // 执行任务的函数
      );
    }
    return this.taskScheduler;
  }

  /**
   * 启动Agent专属任务调度器
   */
  async startTaskScheduler(): Promise<void> {
    const scheduler = this.getTaskScheduler();
    await scheduler.start();
  }

  /**
   * 停止Agent专属任务调度器
   */
  async stopTaskScheduler(): Promise<void> {
    if (this.taskScheduler) {
      await this.taskScheduler.stop();
    }
  }

  /**
   * 手动触发单个任务
   */
  async triggerTask(taskName: string): Promise<void> {
    const scheduler = this.getTaskScheduler();
    await scheduler.triggerTask(taskName);
  }

  /**
   * 执行单个任务 (公共接口)
   */
  async executeTask(taskName: string): Promise<void> {
    await this.executeTaskInternal(taskName);
  }

  /**
   * 内部任务执行逻辑
   */
  private async executeTaskInternal(taskName: string): Promise<void> {
    const task = await this.getTask(taskName);
    if (!task) {
      throw new Error(`任务不存在: ${taskName}`);
    }

    if (task.disabled) {
      throw new Error(`任务已禁用: ${taskName}`);
    }

    try {
      // TODO: 实现Agent级别的任务执行逻辑
      // 这里需要基于task.description执行对应的AI对话
      // 可以集成到聊天系统中，自动执行任务描述作为提示并记录结果
      console.log(`[Agent ${this.config.name}] 开始执行任务: ${task.name}`);
      console.log(`任务描述: ${task.description}`);

      // 创建任务执行记录
      const executionTime = Date.now();
      const chatLog: ChatHistoryItem = {
        key: v4(),
        label: `任务执行: ${task.name}`,
        agentName: this.config.name,
        dateTime: executionTime,
        chatType: "task",
        taskKey: task.name,
        messages: [
          {
            role: "user",
            content: task.description || `执行任务: ${task.name}`,
          }
        ],
      };

      // 保存任务执行记录到聊天历史
      await this.setChatLog(chatLog);

      console.log(`[Agent ${this.config.name}] 任务执行完成: ${task.name}`);
    } catch (error) {
      console.error(`[Agent ${this.config.name}] 任务执行失败: ${task.name}`, error);
      throw error;
    }
  }

  /**
   * 更新任务调度（当任务配置改变时调用）
   */
  async updateTaskSchedule(taskName: string, task: Task, oldTaskName?: string): Promise<void> {
    if (this.taskScheduler) {
      await this.taskScheduler.updateTaskSchedule(taskName, task, oldTaskName);
    }
  }

  /**
   * 删除任务调度
   */
  async deleteTaskSchedule(taskName: string): Promise<void> {
    if (this.taskScheduler) {
      await this.taskScheduler.deleteTaskSchedule(taskName);
    }
  }

  /**
   * 获取任务调度器统计信息
   */
  getTaskSchedulerStats(): {
    running: boolean;
    scheduledTasksCount: number;
    scheduledTasks: string[];
  } {
    if (this.taskScheduler) {
      return this.taskScheduler.getStats();
    }
    return {
      running: false,
      scheduledTasksCount: 0,
      scheduledTasks: [],
    };
  }
}