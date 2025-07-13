import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import {
  TaskSchema,
  Task,
  TaskList,
  CreateTaskRequest,
  UpdateTaskRequest,
  validateCreateTaskRequest,
  validateUpdateTaskRequest,
} from "@dadigua/hyperchat-shared";

/**
 * 任务管理器类
 * 负责管理工作区的任务文件，每个任务以独立的 YAML 文件存储
 */
export class TaskManager {
  private tasksPath: string;

  constructor(private workspacePath: string) {
    this.tasksPath = path.join(workspacePath, "tasks");
  }

  /**
   * 初始化任务管理器
   */
  async init(): Promise<void> {
    // 确保 tasks 目录存在
    if (!fs.existsSync(this.tasksPath)) {
      await fs.promises.mkdir(this.tasksPath, { recursive: true });
    }
  }

  /**
   * 获取任务文件路径
   */
  private getTaskFilePath(taskName: string): string {
    // 使用任务名称作为文件名，去除特殊字符
    const fileName = taskName.replace(/[^a-zA-Z0-9_-]/g, "_") + ".yaml";
    return path.join(this.tasksPath, fileName);
  }

  /**
   * 检查任务是否存在
   */
  async exists(taskName: string): Promise<boolean> {
    const filePath = this.getTaskFilePath(taskName);
    return fs.existsSync(filePath);
  }

  /**
   * 创建任务
   */
  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    // 验证数据
    if (!validateCreateTaskRequest(taskData)) {
      throw new Error("Invalid task data");
    }

    // 检查任务是否已存在
    if (await this.exists(taskData.name)) {
      throw new Error(`Task '${taskData.name}' already exists`);
    }

    // 验证任务数据
    const result = TaskSchema.safeParse(taskData);
    if (!result.success) {
      throw new Error(`Task validation failed: ${result.error.message}`);
    }

    const task: Task = result.data;
    const filePath = this.getTaskFilePath(task.name);

    // 保存任务文件
    const yamlContent = yaml.dump(task, {
      indent: 2,
      lineWidth: 100,
    });

    await fs.promises.writeFile(filePath, yamlContent, "utf-8");
    return task;
  }

  /**
   * 获取单个任务
   */
  async getTask(taskName: string): Promise<Task | null> {
    const filePath = this.getTaskFilePath(taskName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const parsed = yaml.load(content);

      // 使用 Zod 验证
      const result = TaskSchema.safeParse(parsed);

      if (result.success) {
        return result.data;
      } else {
        console.warn(`Task file '${taskName}' validation failed:`, result.error);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load task '${taskName}':`, error);
      return null;
    }
  }

  /**
   * 获取所有任务
   */
  async getAllTasks(): Promise<TaskList> {
    try {
      if (!fs.existsSync(this.tasksPath)) {
        return [];
      }

      const files = await fs.promises.readdir(this.tasksPath);
      const yamlFiles = files.filter(file => file.endsWith(".yaml") || file.endsWith(".yml"));

      const tasks: Task[] = [];

      for (const file of yamlFiles) {
        const filePath = path.join(this.tasksPath, file);

        try {
          const content = await fs.promises.readFile(filePath, "utf-8");
          const parsed = yaml.load(content);

          // 使用 Zod 验证
          const result = TaskSchema.safeParse(parsed);

          if (result.success) {
            tasks.push(result.data);
          } else {
            console.warn(`Task file '${file}' validation failed:`, result.error);
          }
        } catch (error) {
          console.error(`Failed to load task file '${file}':`, error);
        }
      }

      return tasks.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to load tasks:", error);
      return [];
    }
  }

  /**
   * 更新任务
   */
  async updateTask(taskName: string, updates: UpdateTaskRequest): Promise<Task | null> {
    // 验证更新数据
    if (!validateUpdateTaskRequest(updates)) {
      throw new Error("Invalid update data");
    }

    const existingTask = await this.getTask(taskName);
    if (!existingTask) {
      throw new Error(`Task '${taskName}' not found`);
    }

    // 合并数据
    const updatedTaskData = {
      ...existingTask,
      ...updates,
    };

    // 验证更新后的数据
    const result = TaskSchema.safeParse(updatedTaskData);
    if (!result.success) {
      throw new Error(`Task validation failed: ${result.error.message}`);
    }

    const updatedTask = result.data;

    // 如果任务名称改变了，需要重命名文件
    if (taskName !== updatedTask.name) {
      const oldFilePath = this.getTaskFilePath(taskName);
      const newFilePath = this.getTaskFilePath(updatedTask.name);

      // 检查新名称是否已存在
      if (fs.existsSync(newFilePath)) {
        throw new Error(`Task '${updatedTask.name}' already exists`);
      }

      // 删除旧文件
      await fs.promises.unlink(oldFilePath);
    }

    // 保存更新后的任务
    const filePath = this.getTaskFilePath(updatedTask.name);
    const yamlContent = yaml.dump(updatedTask, {
      indent: 2,
      lineWidth: 100,
    });

    await fs.promises.writeFile(filePath, yamlContent, "utf-8");
    return updatedTask;
  }

  /**
   * 删除任务
   */
  async deleteTask(taskName: string): Promise<boolean> {
    const filePath = this.getTaskFilePath(taskName);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete task '${taskName}':`, error);
      return false;
    }
  }

  /**
   * 启用任务
   */
  async enableTask(taskName: string): Promise<Task | null> {
    return await this.updateTask(taskName, { disabled: false });
  }

  /**
   * 禁用任务
   */
  async disableTask(taskName: string): Promise<Task | null> {
    return await this.updateTask(taskName, { disabled: true });
  }

  /**
   * 获取已启用的任务
   */
  async getEnabledTasks(): Promise<TaskList> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => !task.disabled);
  }

  /**
   * 获取已禁用的任务
   */
  async getDisabledTasks(): Promise<TaskList> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.disabled);
  }

  /**
   * 根据 agent 获取任务
   */
  async getTasksByAgent(agentKey: string): Promise<TaskList> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.agentKey === agentKey);
  }

  /**
   * 复制任务
   */
  async cloneTask(taskName: string, newTaskName: string): Promise<Task | null> {
    const existingTask = await this.getTask(taskName);
    if (!existingTask) {
      throw new Error(`Task '${taskName}' not found`);
    }

    if (await this.exists(newTaskName)) {
      throw new Error(`Task '${newTaskName}' already exists`);
    }

    const clonedTask = {
      ...existingTask,
      name: newTaskName,
    };

    return await this.createTask(clonedTask);
  }

  /**
   * 导出所有任务
   */
  async exportTasks(): Promise<string> {
    const tasks = await this.getAllTasks();
    return yaml.dump({ tasks }, {
      indent: 2,
      lineWidth: 100,
    });
  }

  /**
   * 导入任务
   */
  async importTasks(yamlContent: string, overwrite: boolean = false): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const parsed: any = yaml.load(yamlContent);
      const tasks = parsed.tasks || [];

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const taskData of tasks) {
        try {
          // 验证任务数据
          const result = TaskSchema.safeParse(taskData);
          if (!result.success) {
            errors.push(`Task '${taskData.name}' validation failed: ${result.error.message}`);
            continue;
          }

          const task = result.data;

          // 检查是否已存在
          if (await this.exists(task.name)) {
            if (overwrite) {
              await this.updateTask(task.name, task);
              imported++;
            } else {
              skipped++;
            }
          } else {
            await this.createTask(task);
            imported++;
          }
        } catch (error) {
          errors.push(`Failed to import task '${taskData.name}': ${error}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      throw new Error(`Failed to parse import file: ${error}`);
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    agentCounts: Record<string, number>;
  }> {
    const allTasks = await this.getAllTasks();
    const enabled = allTasks.filter(task => !task.disabled);
    const disabled = allTasks.filter(task => task.disabled);

    const agentCounts: Record<string, number> = {};
    for (const task of allTasks) {
      agentCounts[task.agentKey] = (agentCounts[task.agentKey] || 0) + 1;
    }

    return {
      total: allTasks.length,
      enabled: enabled.length,
      disabled: disabled.length,
      agentCounts,
    };
  }

  /**
   * 获取任务目录路径
   */
  getTasksPath(): string {
    return this.tasksPath;
  }

  /**
   * 获取工作区路径
   */
  getWorkspacePath(): string {
    return this.workspacePath;
  }
}