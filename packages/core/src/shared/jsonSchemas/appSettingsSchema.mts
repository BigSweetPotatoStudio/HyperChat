import { z } from "zod";

// 外观设置 Schema
export const AppearanceSchema = z.object({
  darkTheme: z.boolean().default(false).describe("是否启用夜间模式"),
  language: z.enum(["zhCN", "enUS"]).default("zhCN").describe("界面语言"),
});


// 系统设置 Schema
export const SystemSchema = z.object({
  closeAction: z.enum(["minimize", "exit"]).optional().describe("关闭窗口行为"),
  password: z.string().default("123456").describe("应用密码"),
  isDeveloper: z.boolean().default(false).describe("是否为开发者模式"),
  windowSize: z.object({
    width: z.number().min(800).max(4000).default(1440).describe("窗口宽度"),
    height: z.number().min(600).max(3000).default(900).describe("窗口高度"),
  }).default({}),
});


// 完整的应用设置 Schema
export const AppSettingsSchema = z.object({
  // 系统信息（只读）
  version: z.string().default("").describe("应用版本"),
  appDataDir: z.string().default("").describe("应用数据目录"),
  logFilePath: z.string().default("").describe("日志文件路径"),
  PATH: z.string().default("").describe("系统 PATH"),
  platform: z.string().default("").describe("操作系统平台"),
  uuid: z.string().default("").describe("应用唯一标识"),
  lastSyncTime: z.number().default(0).describe("上次同步时间"),

  // 用户可配置设置
  appearance: AppearanceSchema.default({}),
  system: SystemSchema.default({}),

});

// 导出类型
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AppearanceSettings = z.infer<typeof AppearanceSchema>;
export type SystemSettings = z.infer<typeof SystemSchema>;

// 默认设置（不包含 UUID 生成，因为前端不能使用 uuid 库）
export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'uuid'> = (() => {
  const result = AppSettingsSchema.safeParse({});
  if (result.success) {
    const { uuid, ...rest } = result.data;
    return rest;
  }
  // 如果解析失败，返回基础默认值
  throw new Error("Failed to generate default app settings from schema");
})();

// 验证函数
export function validateAppSettings(data: any): data is AppSettings {
  return AppSettingsSchema.safeParse(data).success;
}

export function validateAppearanceSettings(data: any): data is AppearanceSettings {
  return AppearanceSchema.safeParse(data).success;
}


export function validateSystemSettings(data: any): data is SystemSettings {
  return SystemSchema.safeParse(data).success;
}

