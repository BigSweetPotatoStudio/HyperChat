import { z } from "zod";

// 外观设置 Schema
export const AppearanceSchema = z.object({
  darkTheme: z.boolean().default(false).describe("是否启用夜间模式"),
  theme: z.enum(["light", "dark", "auto"]).default("auto").describe("主题模式"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium").describe("字体大小"),
  language: z.enum(["zhCN", "enUS"]).default("zhCN").describe("界面语言"),
  closeAction: z.enum(["minimize", "exit"]).optional().describe("关闭窗口行为"),
});

// 网络设置 Schema
export const NetworkSchema = z.object({
  browserNetworkSetting: z.enum(["server-proxy", "direct"]).default("server-proxy").describe("浏览器网络设置"),
  autoSync: z.boolean().default(false).describe("是否启用自动同步"),
  webdav: z.object({
    url: z.string().default("").describe("WebDAV 服务器地址"),
    username: z.string().default("").describe("WebDAV 用户名"),
    password: z.string().default("").describe("WebDAV 密码"),
    baseDirName: z.string().default("").describe("WebDAV 基础目录名"),
  }).default({}),
});

// 系统设置 Schema
export const SystemSchema = z.object({
  password: z.string().default("123456").describe("应用密码"),
  runTask: z.boolean().default(false).describe("是否运行任务"),
  isDeveloper: z.boolean().default(false).describe("是否为开发者模式"),
  isLoadClaudeConfig: z.boolean().default(true).describe("是否加载 Claude 配置"),
  firstOpen: z.boolean().default(true).describe("是否为首次打开"),
  windowSize: z.object({
    width: z.number().min(800).max(4000).default(1440).describe("窗口宽度"),
    height: z.number().min(600).max(3000).default(900).describe("窗口高度"),
  }).default({}),
});

// 开发者设置 Schema
export const DeveloperSchema = z.object({
  enableDebugMode: z.boolean().default(false).describe("是否启用调试模式"),
  enableTelemetry: z.boolean().default(false).describe("是否启用遥测"),
  experimentalFeatures: z.boolean().default(false).describe("是否启用实验性功能"),
  showAdvancedOptions: z.boolean().default(false).describe("是否显示高级选项"),
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
  network: NetworkSchema.default({}),
  system: SystemSchema.default({}),
  developer: DeveloperSchema.default({}),
  
  // 内部状态（保留兼容性）
  downloaded: z.record(z.string(), z.boolean()).default({}).describe("下载状态记录"),
  updated: z.record(z.string(), z.boolean()).default({}).describe("更新状态记录"),
});

// 导出类型
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AppearanceSettings = z.infer<typeof AppearanceSchema>;
export type NetworkSettings = z.infer<typeof NetworkSchema>;
export type SystemSettings = z.infer<typeof SystemSchema>;
export type DeveloperSettings = z.infer<typeof DeveloperSchema>;

// 默认设置（不包含 UUID 生成，因为前端不能使用 uuid 库）
export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'uuid'> = {
  version: "",
  appDataDir: "",
  logFilePath: "",
  PATH: "",
  platform: "",
  lastSyncTime: 0,
  appearance: {
    darkTheme: false,
    theme: "auto",
    fontSize: "medium",
    language: "zhCN",
  },
  network: {
    browserNetworkSetting: "server-proxy",
    autoSync: false,
    webdav: {
      url: "",
      username: "",
      password: "",
      baseDirName: "",
    },
  },
  system: {
    password: "123456",
    runTask: false,
    isDeveloper: false,
    isLoadClaudeConfig: true,
    firstOpen: true,
    windowSize: {
      width: 1440,
      height: 900,
    },
  },
  developer: {
    enableDebugMode: false,
    enableTelemetry: false,
    experimentalFeatures: false,
    showAdvancedOptions: false,
  },
  downloaded: {},
  updated: {},
};

// 验证函数
export function validateAppSettings(data: any): data is AppSettings {
  return AppSettingsSchema.safeParse(data).success;
}

export function validateAppearanceSettings(data: any): data is AppearanceSettings {
  return AppearanceSchema.safeParse(data).success;
}

export function validateNetworkSettings(data: any): data is NetworkSettings {
  return NetworkSchema.safeParse(data).success;
}

export function validateSystemSettings(data: any): data is SystemSettings {
  return SystemSchema.safeParse(data).success;
}

export function validateDeveloperSettings(data: any): data is DeveloperSettings {
  return DeveloperSchema.safeParse(data).success;
}