import { z } from "zod";

/**
 * 任务 Schema
 * 定义定时任务的结构和验证规则
 */
export const TaskSchema = z.object({
  name: z.string()
    .min(1, "任务名称不能为空")
    .max(100, "任务名称不能超过100个字符")
    .describe("任务名称"),
  
  agentKey: z.string()
    .min(1, "代理键不能为空")
    .describe("执行任务的代理键"),
  
  description: z.string()
    .min(1, "任务描述不能为空")
    .max(500, "任务描述不能超过500个字符")
    .describe("任务描述"),
  
  cron: z.string()
    .min(1, "定时表达式不能为空")
    .regex(
      /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([12]?\d|3[01])) (\*|([1-9]|1[012])) (\*|[0-6])$/,
      "定时表达式格式不正确，请使用标准 cron 格式"
    )
    .describe("定时表达式 (cron 格式)"),
  
  disabled: z.boolean()
    .default(false)
    .describe("是否禁用任务")
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
  name: "新任务",
  agentKey: "",
  description: "任务描述",
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
  [CRON_TEMPLATES.EVERY_MINUTE]: "每分钟执行",
  [CRON_TEMPLATES.EVERY_HOUR]: "每小时执行",
  [CRON_TEMPLATES.EVERY_DAY]: "每天午夜执行",
  [CRON_TEMPLATES.EVERY_WEEK]: "每周日午夜执行",
  [CRON_TEMPLATES.EVERY_MONTH]: "每月1号午夜执行",
  [CRON_TEMPLATES.EVERY_YEAR]: "每年1月1号午夜执行",
  [CRON_TEMPLATES.WORK_DAYS]: "工作日上午9点执行",
  [CRON_TEMPLATES.WEEKENDS]: "周末上午10点执行",
} as const;