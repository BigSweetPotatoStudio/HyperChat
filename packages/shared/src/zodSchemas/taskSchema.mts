import { z } from "zod";

/**
 * 任务 Schema
 * 定义定时任务的结构和验证规则
 */
export const TaskSchema = z.object({
  name: z.string()
    .min(1, "Task name cannot be empty")
    .max(100, "Task name cannot exceed 100 characters")
    .describe("Task name"),
  
  agentName: z.string()
    .min(1, "Agent name cannot be empty")
    .describe("Agent name for task execution"),
  
  description: z.string()
    .min(1, "Task description cannot be empty")
    .max(500, "Task description cannot exceed 500 characters")
    .describe("Task description"),
  
  cron: z.string()
    .min(1, "Cron expression cannot be empty")
    .regex(
      /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/,
      "Invalid cron expression format, please use standard cron format"
    )
    .describe("Cron expression (cron format)"),
  
  disabled: z.boolean()
    .default(false)
    .describe("Whether to disable the task")
});

/**
 * 任务列表 Schema
 */
export const TaskListSchema = z.array(TaskSchema);

/**
 * 创建任务请求 Schema
 */
export const CreateTaskSchema = TaskSchema.omit({}).extend({
  // 可以在这里添加创建任务时的特殊字段
});

/**
 * 更新任务请求 Schema
 */
export const UpdateTaskSchema = TaskSchema.partial().extend({
  name: z.string().min(1).optional(), // name 在更新时仍需要验证长度
});

// 导出类型
export type Task = z.infer<typeof TaskSchema>;
export type TaskList = z.infer<typeof TaskListSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskSchema>;

// 默认任务配置
export const DEFAULT_TASK: Task = {
  name: "New Task",
  agentName: "",
  description: "Task description",
  cron: "0 0 * * *", // 每天午夜执行
  disabled: false
};

// 验证函数
export function validateTask(data: any): data is Task {
  return TaskSchema.safeParse(data).success;
}

export function validateTaskList(data: any): data is TaskList {
  return TaskListSchema.safeParse(data).success;
}

export function validateCreateTaskRequest(data: any): data is CreateTaskRequest {
  return CreateTaskSchema.safeParse(data).success;
}

export function validateUpdateTaskRequest(data: any): data is UpdateTaskRequest {
  return UpdateTaskSchema.safeParse(data).success;
}

// 常用的 cron 表达式模板
export const CRON_TEMPLATES = {
  EVERY_MINUTE: "* * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_DAY: "0 0 * * *",
  EVERY_WEEK: "0 0 * * 0",
  EVERY_MONTH: "0 0 1 * *",
  EVERY_YEAR: "0 0 1 1 *",
  WORK_DAYS: "0 9 * * 1-5", // 工作日上午9点
  WEEKENDS: "0 10 * * 0,6", // 周末上午10点
} as const;

// Cron 表达式描述
export const CRON_DESCRIPTIONS = {
  [CRON_TEMPLATES.EVERY_MINUTE]: "Execute every minute",
  [CRON_TEMPLATES.EVERY_HOUR]: "Execute every hour",
  [CRON_TEMPLATES.EVERY_DAY]: "Execute every day at midnight",
  [CRON_TEMPLATES.EVERY_WEEK]: "Execute every Sunday at midnight",
  [CRON_TEMPLATES.EVERY_MONTH]: "Execute on the 1st of every month at midnight",
  [CRON_TEMPLATES.EVERY_YEAR]: "Execute on January 1st every year at midnight",
  [CRON_TEMPLATES.WORK_DAYS]: "Execute at 9 AM on weekdays",
  [CRON_TEMPLATES.WEEKENDS]: "Execute at 10 AM on weekends",
} as const;