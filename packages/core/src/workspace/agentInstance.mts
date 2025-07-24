import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { CONSTANTS } from "./constants.mjs";

import { DataList } from "./dataList.mjs";
import { sanitizeFileName } from "../common/util.mjs";
import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared";
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import type { Task } from "@dadigua/hyperchat-shared";
import type { WorkspaceMCPConfig } from "./mcp/types.mjs";

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
   * 更新 Agent 配置
   */
  async updateConfig(updates: Partial<AgentConfig>): Promise<boolean> {
    const oldName = this.config.name;
    const newName = updates.name;

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
    return await this.chatLogs!.set(chatLog);
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
        lastModified: Date.now(),
        created: config.created || Date.now(),
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
}