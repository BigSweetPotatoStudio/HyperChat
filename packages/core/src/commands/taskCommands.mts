/**
 * 任务管理命令模块
 */

import { workspaceManager } from '../workspace/index.mjs';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest 
} from '@dadigua/hyperchat-shared';

/**
 * 任务管理命令集合
 */
export const taskCommands = {
  /**
   * 创建任务
   */
  async createTask(params: { workspacePath: string; taskData: CreateTaskRequest }): Promise<Task> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.createTask(params.taskData);
  },

  /**
   * 获取单个任务
   */
  async getTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getTask(params.taskName);
  },

  /**
   * 获取所有任务
   */
  async getAllTasks(params: { workspacePath: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getAllTasks();
  },

  /**
   * 更新任务
   */
  async updateTask(params: { 
    workspacePath: string; 
    taskName: string; 
    updates: UpdateTaskRequest 
  }): Promise<Task | null> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.updateTask(params.taskName, params.updates);
  },

  /**
   * 删除任务
   */
  async deleteTask(params: { workspacePath: string; taskName: string }): Promise<boolean> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.deleteTask(params.taskName);
  },

  /**
   * 启用任务
   */
  async enableTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.enableTask(params.taskName);
  },

  /**
   * 禁用任务
   */
  async disableTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.disableTask(params.taskName);
  },

  /**
   * 获取已启用的任务
   */
  async getEnabledTasks(params: { workspacePath: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getEnabledTasks();
  },

  /**
   * 获取已禁用的任务
   */
  async getDisabledTasks(params: { workspacePath: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getDisabledTasks();
  },

  /**
   * 根据 agent 获取任务
   */
  async getTasksByAgent(params: { workspacePath: string; agentKey: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getTasksByAgent(params.agentKey);
  },

  /**
   * 复制任务
   */
  async cloneTask(params: { 
    workspacePath: string; 
    taskName: string; 
    newTaskName: string 
  }): Promise<Task | null> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.cloneTask(params.taskName, params.newTaskName);
  },


  /**
   * 获取任务统计信息
   */
  async getTaskStats(params: { workspacePath: string }): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    agentCounts: Record<string, number>;
  }> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.getTaskStats();
  },

  /**
   * 手动触发任务执行
   */
  async triggerTask(params: { workspacePath: string; taskName: string }): Promise<void> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return await workspace.triggerTask(params.taskName);
  },

  /**
   * 获取调度状态
   */
  async getScheduledTasks(params: { workspacePath: string }): Promise<string[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    return workspace.getScheduledTasks();
  },
};

export type TaskCommandsType = typeof taskCommands;