/**
 * 任务管理命令模块 - Agent-centered架构版本
 * 所有任务管理都通过Agent实例处理
 */

import { workspaceManager } from '../workspace/index.mjs';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest 
} from '@dadigua/hyperchat-shared';

/**
 * 查找任务所属的Agent
 */
async function findAgentByTask(taskName: string): Promise<{ agentName: string; agentInstance: any } | null> {
  const workspace = workspaceManager.getCurrentWorkspace();
  const agents = await workspace.getAllAgents();
  
  for (const agentConfig of agents) {
    const agentInstance = workspace.getAgentInstance(agentConfig.name);
    if (agentInstance) {
      const task = await agentInstance.getTask(taskName);
      if (task) {
        return { agentName: agentConfig.name, agentInstance };
      }
    }
  }
  return null;
}

/**
 * 任务管理命令集合
 */
export const taskCommands = {
  /**
   * 创建任务 - 需要指定Agent
   */
  async createTask(params: { 
    workspacePath: string; 
    taskData: CreateTaskRequest;
    agentName?: string; // 指定Agent，如果未指定则使用第一个可用Agent
  }): Promise<Task> {
    const workspace = workspaceManager.getCurrentWorkspace();
    
    // 确定目标Agent
    let targetAgentName = params.agentName;
    if (!targetAgentName) {
      const agents = await workspace.getAllAgents();
      if (agents.length === 0) {
        throw new Error('没有可用的Agent来创建任务');
      }
      targetAgentName = agents[0].name;
    }
    
    const agentInstance = workspace.getAgentInstance(targetAgentName);
    if (!agentInstance) {
      throw new Error(`Agent不存在: ${targetAgentName}`);
    }
    
    // 确保任务关联到正确的Agent
    const taskWithAgent: Task = {
      ...params.taskData,
      agentName: targetAgentName,
    };
    
    const success = await agentInstance.addTask(taskWithAgent);
    if (!success) {
      throw new Error('创建任务失败');
    }
    
    return taskWithAgent;
  },

  /**
   * 获取单个任务 - 自动查找所属Agent
   */
  async getTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      return null;
    }
    
    return await result.agentInstance.getTask(params.taskName);
  },

  /**
   * 获取所有任务 - 聚合所有Agent的任务
   */
  async getAllTasks(params: { workspacePath: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    const agents = await workspace.getAllAgents();
    const allTasks: Task[] = [];
    
    for (const agentConfig of agents) {
      const agentInstance = workspace.getAgentInstance(agentConfig.name);
      if (agentInstance) {
        const tasks = await agentInstance.getTasks();
        allTasks.push(...tasks);
      }
    }
    
    return allTasks;
  },

  /**
   * 更新任务 - 自动查找所属Agent
   */
  async updateTask(params: { 
    workspacePath: string; 
    taskName: string; 
    updates: UpdateTaskRequest 
  }): Promise<Task | null> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      throw new Error(`任务不存在: ${params.taskName}`);
    }
    
    // 构建完整的任务对象
    const currentTask = await result.agentInstance.getTask(params.taskName);
    if (!currentTask) {
      return null;
    }
    
    const updatedTask: Task = {
      ...currentTask,
      ...params.updates,
      agentName: result.agentName, // 保持Agent关联
    };
    
    const success = await result.agentInstance.updateTask(params.taskName, updatedTask);
    return success ? updatedTask : null;
  },

  /**
   * 删除任务 - 自动查找所属Agent
   */
  async deleteTask(params: { workspacePath: string; taskName: string }): Promise<boolean> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      return false; // 任务不存在，视为删除成功
    }
    
    return await result.agentInstance.deleteTask(params.taskName);
  },

  /**
   * 启用任务 - 自动查找所属Agent
   */
  async enableTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      throw new Error(`任务不存在: ${params.taskName}`);
    }
    
    const currentTask = await result.agentInstance.getTask(params.taskName);
    if (!currentTask) {
      return null;
    }
    
    const enabledTask: Task = {
      ...currentTask,
      disabled: false,
    };
    
    const success = await result.agentInstance.updateTask(params.taskName, enabledTask);
    return success ? enabledTask : null;
  },

  /**
   * 禁用任务 - 自动查找所属Agent
   */
  async disableTask(params: { workspacePath: string; taskName: string }): Promise<Task | null> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      throw new Error(`任务不存在: ${params.taskName}`);
    }
    
    const currentTask = await result.agentInstance.getTask(params.taskName);
    if (!currentTask) {
      return null;
    }
    
    const disabledTask: Task = {
      ...currentTask,
      disabled: true,
    };
    
    const success = await result.agentInstance.updateTask(params.taskName, disabledTask);
    return success ? disabledTask : null;
  },

  /**
   * 获取已启用的任务 - 聚合所有Agent的已启用任务
   */
  async getEnabledTasks(params: { workspacePath: string }): Promise<Task[]> {
    const allTasks = await taskCommands.getAllTasks(params);
    return allTasks.filter(task => !task.disabled);
  },

  /**
   * 获取已禁用的任务 - 聚合所有Agent的已禁用任务
   */
  async getDisabledTasks(params: { workspacePath: string }): Promise<Task[]> {
    const allTasks = await taskCommands.getAllTasks(params);
    return allTasks.filter(task => task.disabled);
  },

  /**
   * 根据 agent 获取任务 - 直接从指定Agent获取
   */
  async getTasksByAgent(params: { workspacePath: string; agentName: string }): Promise<Task[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    const agentInstance = workspace.getAgentInstance(params.agentName);
    
    if (!agentInstance) {
      return [];
    }
    
    return await agentInstance.getTasks();
  },

  /**
   * 复制任务 - 支持跨Agent复制
   */
  async cloneTask(params: { 
    workspacePath: string; 
    taskName: string; 
    newTaskName: string;
    targetAgentName?: string; // 目标Agent，如果未指定则复制到同一Agent
  }): Promise<Task | null> {
    // 查找源任务
    const sourceResult = await findAgentByTask(params.taskName);
    if (!sourceResult) {
      throw new Error(`源任务不存在: ${params.taskName}`);
    }
    
    const sourceTask = await sourceResult.agentInstance.getTask(params.taskName);
    if (!sourceTask) {
      return null;
    }
    
    // 确定目标Agent
    const targetAgentName = params.targetAgentName || sourceResult.agentName;
    const workspace = workspaceManager.getCurrentWorkspace();
    const targetAgentInstance = workspace.getAgentInstance(targetAgentName);
    
    if (!targetAgentInstance) {
      throw new Error(`目标Agent不存在: ${targetAgentName}`);
    }
    
    // 创建新任务
    const clonedTask: Task = {
      ...sourceTask,
      name: params.newTaskName,
      agentName: targetAgentName,
    };
    
    const success = await targetAgentInstance.addTask(clonedTask);
    return success ? clonedTask : null;
  },

  /**
   * 获取任务统计信息 - 聚合所有Agent的统计
   */
  async getTaskStats(params: { workspacePath: string }): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    agentCounts: Record<string, number>;
  }> {
    const workspace = workspaceManager.getCurrentWorkspace();
    const agents = await workspace.getAllAgents();
    
    let total = 0;
    let enabled = 0;
    let disabled = 0;
    const agentCounts: Record<string, number> = {};
    
    for (const agentConfig of agents) {
      const agentInstance = workspace.getAgentInstance(agentConfig.name);
      if (agentInstance) {
        const tasks = await agentInstance.getTasks();
        const agentTaskCount = tasks.length;
        
        total += agentTaskCount;
        agentCounts[agentConfig.name] = agentTaskCount;
        
        for (const task of tasks) {
          if (task.disabled) {
            disabled++;
          } else {
            enabled++;
          }
        }
      }
    }
    
    return {
      total,
      enabled,
      disabled,
      agentCounts,
    };
  },

  /**
   * 手动触发任务执行 - 自动查找所属Agent
   */
  async triggerTask(params: { workspacePath: string; taskName: string }): Promise<void> {
    const result = await findAgentByTask(params.taskName);
    if (!result) {
      throw new Error(`任务不存在: ${params.taskName}`);
    }
    
    return await result.agentInstance.triggerTask(params.taskName);
  },

  /**
   * 获取调度状态 - 聚合所有Agent的调度任务
   */
  async getScheduledTasks(params: { workspacePath: string }): Promise<string[]> {
    const workspace = workspaceManager.getCurrentWorkspace();
    const agents = await workspace.getAllAgents();
    const scheduledTasks: string[] = [];
    
    for (const agentConfig of agents) {
      const agentInstance = workspace.getAgentInstance(agentConfig.name);
      if (agentInstance) {
        const stats = agentInstance.getTaskSchedulerStats();
        scheduledTasks.push(...stats.scheduledTasks);
      }
    }
    
    return scheduledTasks;
  },
};

export type TaskCommandsType = typeof taskCommands;