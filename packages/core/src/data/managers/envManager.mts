import {
  EnvSchema,
  type EnvConfig,
  DEFAULT_ENV_CONFIG
} from "@dadigua/hyperchat-shared";
import { Logger } from "../../log.mjs";
import { DotenvLoader } from "../../utils/dotenvLoader.mjs";
import * as path from "path";

/**
 * 配置来源枚举
 */
export enum ConfigSource {
  DEFAULT = 'default',
  PROCESS_ENV = 'process.env',
  GLOBAL_ENV = 'global/.hyperchat/.env',
  WORKSPACE_ENV = 'workspace/.hyperchat/.env',
  CLI_ARGS = 'cli.args'
}

/**
 * 配置加载信息
 */
export interface ConfigLoadInfo {
  source: ConfigSource;
  path?: string;
  loadedKeys: string[];
}

/**
 * 环境变量管理器
 * 支持多层配置叠加：默认值 < 环境变量 < 全局.env < 工作区.env < CLI参数
 */
export class EnvManager {
  private static instances: Map<string, EnvManager> = new Map();
  private envConfig: EnvConfig;
  private workspacePath?: string;
  private cliArgs?: Partial<EnvConfig>;
  private loadInfo: ConfigLoadInfo[] = [];

  private constructor(workspacePath?: string, cliArgs?: Partial<EnvConfig>) {
    this.workspacePath = workspacePath;
    this.cliArgs = cliArgs;
    this.envConfig = this.parseEnvConfig();
  }

  /**
   * 全局默认实例，可以被CLI覆盖
   */
  private static globalDefault?: EnvManager;

  /**
   * 设置全局默认环境管理器实例（用于CLI参数覆盖）
   */
  public static setGlobalDefault(instance: EnvManager): void {
    EnvManager.globalDefault = instance;
  }

  /**
   * 获取环境变量管理器实例
   * @param workspacePath 工作区路径，用于加载工作区特定的环境配置
   * @param cliArgs CLI 参数覆盖（最高优先级）
   */
  public static getInstance(workspacePath?: string, cliArgs?: Partial<EnvConfig>): EnvManager {
    // 如果有 CLI 参数，创建新的实例而不使用缓存
    if (cliArgs && Object.keys(cliArgs).length > 0) {
      return new EnvManager(workspacePath, cliArgs);
    }

    // 如果没有指定参数且存在全局默认实例，使用全局默认实例
    if (!workspacePath && EnvManager.globalDefault) {
      return EnvManager.globalDefault;
    }

    const key = workspacePath || 'global';

    if (!EnvManager.instances.has(key)) {
      EnvManager.instances.set(key, new EnvManager(workspacePath));
    }

    return EnvManager.instances.get(key)!;
  }

  /**
   * 复杂的环境变量解析逻辑
   * 优先级：默认值 < process.env < 全局.env < 工作区.env < CLI参数
   * 
   * 特殊处理：HyperChat_AppDataDir 会影响全局配置文件的加载路径
   */
  private parseEnvConfig(): EnvConfig {
    this.loadInfo = [];
    let mergedEnv: Record<string, any> = {};

    // 1. 开始于默认值
    const defaultValues = DEFAULT_ENV_CONFIG;
    mergedEnv = { ...defaultValues };
    this.logConfigSource(ConfigSource.DEFAULT, Object.keys(defaultValues));

    // 2. 叠加系统环境变量（包括可能的 AppDataDir）
    const processEnvKeys: string[] = [];
    for (const [key, value] of Object.entries(process.env)) {
      if (key in defaultValues && value !== undefined) {
        mergedEnv[key] = value;
        processEnvKeys.push(key);
      }
    }
    if (processEnvKeys.length > 0) {
      this.logConfigSource(ConfigSource.PROCESS_ENV, processEnvKeys);
    }

    // 3. 处理 CLI 参数中的 AppDataDir (提前处理，因为它影响全局路径)
    let dynamicAppDataDir: string | undefined;
    if (this.cliArgs?.HyperChat_AppDataDir) {
      dynamicAppDataDir = this.cliArgs.HyperChat_AppDataDir;
      mergedEnv.HyperChat_AppDataDir = dynamicAppDataDir;
      Logger.debug(`Using CLI AppDataDir: ${dynamicAppDataDir}`);
    } else if (mergedEnv.HyperChat_AppDataDir) {
      dynamicAppDataDir = mergedEnv.HyperChat_AppDataDir;
      Logger.debug(`Using env AppDataDir: ${dynamicAppDataDir}`);
    }

    // 4. 叠加全局 .hyperchat/.env (使用动态的 AppDataDir)
    const globalEnvPath = this.getGlobalEnvPath(dynamicAppDataDir);
    const globalEnv = DotenvLoader.loadEnvFile(globalEnvPath);
    const globalKeys = Object.keys(globalEnv);
    if (globalKeys.length > 0) {
      mergedEnv = { ...mergedEnv, ...globalEnv };
      this.logConfigSource(ConfigSource.GLOBAL_ENV, globalKeys, globalEnvPath);
    }

    // 5. 叠加工作区 .hyperchat/.env
    if (this.workspacePath) {
      const workspaceEnvPath = this.getWorkspaceEnvPath();
      const workspaceEnv = DotenvLoader.loadEnvFile(workspaceEnvPath);
      const workspaceKeys = Object.keys(workspaceEnv);
      if (workspaceKeys.length > 0) {
        mergedEnv = { ...mergedEnv, ...workspaceEnv };
        this.logConfigSource(ConfigSource.WORKSPACE_ENV, workspaceKeys, workspaceEnvPath);
      }
    }

    // 6. 叠加 CLI 参数 (最高优先级)
    if (this.cliArgs) {
      const cliKeys = Object.keys(this.cliArgs).filter(key => (this.cliArgs as any)![key] !== undefined);
      if (cliKeys.length > 0) {
        // 只复制非 undefined 的值
        const filteredCliArgs = Object.fromEntries(
          cliKeys.map(key => [key, (this.cliArgs as any)![key]])
        );
        mergedEnv = { ...mergedEnv, ...filteredCliArgs };
        this.logConfigSource(ConfigSource.CLI_ARGS, cliKeys);
      }
    }

    // 7. 验证最终配置
    const result = EnvSchema.safeParse(mergedEnv);

    if (result.success) {
      Logger.info("Environment configuration loaded successfully with layered priority");
      return result.data;
    }

    // 如果验证失败，打印错误详情
    Logger.error("Environment validation failed:", result.error.format());
    Logger.warn("Using default environment configuration");

    return DEFAULT_ENV_CONFIG;
  }

  /**
   * 记录配置来源信息
   */
  private logConfigSource(source: ConfigSource, keys: string[], path?: string): void {
    this.loadInfo.push({
      source,
      path,
      loadedKeys: keys
    });

    Logger.debug(`Loaded config from ${source}${path ? ` (${path})` : ''}:`, {
      keysCount: keys.length,
      keys: keys
    });
  }

  /**
   * 获取全局环境文件路径
   * @param customAppDataDir 自定义的全局数据目录路径
   */
  private getGlobalEnvPath(customAppDataDir?: string): string {
    if (customAppDataDir) {
      return path.join(customAppDataDir, '.hyperchat', '.env');
    }
    
    // 默认路径
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, 'Documents', 'HyperChat', '.hyperchat', '.env');
  }

  /**
   * 获取工作区环境文件路径
   */
  private getWorkspaceEnvPath(): string {
    if (!this.workspacePath) {
      throw new Error('Workspace path not set');
    }
    return path.join(this.workspacePath, '.hyperchat', '.env');
  }

  /**
   * 获取环境配置
   */
  public getConfig(): EnvConfig {
    return this.envConfig;
  }

  /**
   * 获取特定的环境变量值
   */
  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.envConfig[key];
  }

  /**
   * 检查是否为开发环境
   */
  public isDevelopment(): boolean {
    return this.envConfig.NODE_ENV === 'development';
  }

  /**
   * 检查是否为生产环境
   */
  public isProduction(): boolean {
    return this.envConfig.NODE_ENV === 'production';
  }

  /**
   * 获取配置加载信息
   */
  public getLoadInfo(): ConfigLoadInfo[] {
    return [...this.loadInfo];
  }

  /**
   * 获取工作区路径
   */
  public getWorkspacePath(): string | undefined {
    return this.workspacePath;
  }

  /**
   * 重新加载环境变量配置
   */
  public reload(): void {
    this.envConfig = this.parseEnvConfig();
    Logger.info("Environment configuration reloaded");
  }

  /**
   * 打印详细的配置信息（包括来源和优先级）
   */
  public logDetailedConfig(): void {
    Logger.info("=== Environment Configuration Details ===");

    // 打印加载层次
    Logger.info("Configuration layers (priority order):");
    this.loadInfo.forEach((info, index) => {
      Logger.info(`  ${index + 1}. ${info.source}${info.path ? ` (${info.path})` : ''}`);
      Logger.info(`     Keys: [${info.loadedKeys.join(', ')}]`);
    });

    // 打印最终配置（隐藏敏感信息）
    const safeConfig = { ...this.envConfig };

    // 隐藏敏感的 API Keys
    if (safeConfig.HyperChat_API_KEY) {
      (safeConfig).HyperChat_API_KEY = '***';
    }

    Logger.info("Final merged configuration:", safeConfig);
    Logger.info("==========================================");
  }

  /**
   * 打印简化的配置信息
   */
  public logConfig(): void {
    const safeConfig = { ...this.envConfig };

    // 隐藏敏感的 API Keys
    if (safeConfig.HyperChat_API_KEY) {
      (safeConfig).HyperChat_API_KEY = '***';
    }

    Logger.info("Current environment configuration:", safeConfig);
  }

  /**
   * 创建工作区 .env 示例文件
   */
  public createWorkspaceEnvExample(): void {
    if (!this.workspacePath) {
      Logger.warn("Cannot create workspace .env example: no workspace path set");
      return;
    }

    const envPath = this.getWorkspaceEnvPath();
    DotenvLoader.createExampleEnv(envPath);
  }

  /**
   * 获取当前使用的全局数据目录路径
   */
  public getActualGlobalDataDir(): string {
    const config = this.getConfig();
    if (config.HyperChat_AppDataDir) {
      return config.HyperChat_AppDataDir;
    }
    
    // 默认路径
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, 'Documents', 'HyperChat');
  }

  /**
   * 获取当前使用的全局 .env 文件路径
   */
  public getActualGlobalEnvPath(): string {
    return path.join(this.getActualGlobalDataDir(), '.hyperchat', '.env');
  }

  /**
   * 创建全局 .env 示例文件
   */
  public static createGlobalEnvExample(customAppDataDir?: string): void {
    let envPath: string;
    
    if (customAppDataDir) {
      envPath = path.join(customAppDataDir, '.hyperchat', '.env');
    } else {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      envPath = path.join(homeDir, 'Documents', 'HyperChat', '.hyperchat', '.env');
    }
    
    DotenvLoader.createExampleEnv(envPath);
  }

  /**
   * 创建全局 .env 示例文件（使用当前配置的路径）
   */
  public createGlobalEnvExampleAtCurrentPath(): void {
    const envPath = this.getActualGlobalEnvPath();
    DotenvLoader.createExampleEnv(envPath);
  }
}

// 导出默认的全局环境管理器实例（向后兼容）
export const envManager = EnvManager.getInstance();

// 导出全局环境配置（向后兼容）
export const ENV = envManager.getConfig();