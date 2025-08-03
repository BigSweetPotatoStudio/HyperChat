import type { EnvConfig } from "@dadigua/hyperchat-shared";

/**
 * CLI 参数解析工具
 * 用于将命令行参数转换为环境配置对象
 */
export class CliArgsParser {
  
  /**
   * 支持的 CLI 参数映射到环境变量
   */
  private static readonly CLI_ARG_MAPPING: Record<string, keyof EnvConfig> = {
    '--port': 'HyperChat_HTTP_PORT',
    '-p': 'HyperChat_HTTP_PORT',
    '--env': 'NODE_ENV',
    '--my-env': 'HyperChat_MY_ENV',
    '--app-data-dir': 'HyperChat_AppDataDir',
    '--data-dir': 'HyperChat_AppDataDir',
    '--api-key': 'HyperChat_API_KEY',
    '--api-url': 'HyperChat_API_URL',
    '--ai-provider': 'HyperChat_AI_Provider',
    '--ai-model': 'HyperChat_AI_Model',
    '--log-level': 'LOG_LEVEL',
    '--verbose': 'LOG_LEVEL', // 特殊处理
    '-v': 'LOG_LEVEL',
    '--quiet': 'LOG_LEVEL', // 特殊处理
    '-q': 'LOG_LEVEL',
    '--web-password': 'HyperChat_Web_Password',
    '--password': 'HyperChat_Web_Password',
    '--language': 'HyperChat_Language',
    '--lang': 'HyperChat_Language'
  };

  /**
   * 解析命令行参数数组
   * @param args 命令行参数数组 (通常是 process.argv.slice(2))
   * @returns 解析后的环境配置对象
   */
  public static parseArgs(args: string[]): Partial<EnvConfig> {
    const result: Partial<EnvConfig> = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      // 跳过非选项参数
      if (!arg.startsWith('-')) {
        continue;
      }

      // 获取映射的环境变量名
      const envKey = this.CLI_ARG_MAPPING[arg];
      if (!envKey) {
        continue;
      }

      // 特殊处理 verbose 和 quiet
      if (arg === '--verbose' || arg === '-v') {
        (result as any)[envKey] = 'debug';
        continue;
      }
      
      if (arg === '--quiet' || arg === '-q') {
        (result as any)[envKey] = 'warn';
        continue;
      }

      // 获取参数值
      const nextArg = args[i + 1];
      if (!nextArg || nextArg.startsWith('-')) {
        // 布尔标志或缺少值
        continue;
      }

      // 类型转换
      const value = this.convertValue(envKey, nextArg);
      if (value !== undefined) {
        (result as any)[envKey] = value;
        i++; // 跳过已处理的值
      }
    }

    return result;
  }

  /**
   * 根据环境变量类型转换值
   */
  private static convertValue(envKey: keyof EnvConfig, value: string): any {
    switch (envKey) {
      case 'HyperChat_HTTP_PORT':
        const port = parseInt(value, 10);
        return isNaN(port) ? undefined : port;
      
      case 'NODE_ENV':
        return ['development', 'production'].includes(value) ? value : undefined;
      
      case 'LOG_LEVEL':
        return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(value) ? value : undefined;

      case 'HyperChat_Language':
        return ['zh', 'en', 'ja', 'ko', 'fr', 'de'].includes(value) ? value : undefined;
        
      
      default:
        return value;
    }
  }

  /**
   * 从对象参数解析环境配置
   * @param options 选项对象
   * @returns 解析后的环境配置对象
   */
  public static parseOptions(options: Record<string, any>): Partial<EnvConfig> {
    const result: Partial<EnvConfig> = {};

    // 映射选项到环境变量
    const optionMapping: Record<string, keyof EnvConfig> = {
      port: 'HyperChat_HTTP_PORT',
      env: 'NODE_ENV',
      myEnv: 'HyperChat_MY_ENV',
      appDataDir: 'HyperChat_AppDataDir',
      dataDir: 'HyperChat_AppDataDir',
      apiKey: 'HyperChat_API_KEY',
      apiUrl: 'HyperChat_API_URL',
      aiProvider: 'HyperChat_AI_Provider',
      aiModel: 'HyperChat_AI_Model',
      logLevel: 'LOG_LEVEL',
      verbose: 'LOG_LEVEL',
      quiet: 'LOG_LEVEL',
      webPassword: 'HyperChat_Web_Password',
      password: 'HyperChat_Web_Password',
      language: 'HyperChat_Language',
      lang: 'HyperChat_Language'
    };

    for (const [optionKey, envKey] of Object.entries(optionMapping)) {
      const value = options[optionKey];
      if (value === undefined) {
        continue;
      }

      // 特殊处理 verbose 和 quiet
      if (optionKey === 'verbose' && value) {
        (result as any)[envKey] = 'debug';
        continue;
      }
      
      if (optionKey === 'quiet' && value) {
        (result as any)[envKey] = 'warn';
        continue;
      }

      // 类型转换
      const converted = this.convertValue(envKey, String(value));
      if (converted !== undefined) {
        (result as any)[envKey] = converted;
      }
    }

    return result;
  }

  /**
   * 显示支持的 CLI 参数帮助信息
   */
  public static getHelpText(): string {
    return `Environment Configuration Options:
  -p, --port <number>        HTTP server port (default: 16100)
  --env <env>                Environment: development|production (default: production)
  --my-env <env>             Custom environment flag (default: prod)
  --app-data-dir <path>      Global application data directory path
  --data-dir <path>          Alias for --app-data-dir
  --api-key <key>            HyperChat API key
  --api-url <url>            HyperChat API URL
  --ai-provider <provider>   AI provider name
  --ai-model <model>         AI model name
  --log-level <level>        Log level: trace|debug|info|warn|error|fatal (default: info)
  -v, --verbose              Enable verbose logging (sets log-level to debug)
  -q, --quiet                Enable quiet mode (sets log-level to warn)
  --web-password <password>  Web interface access password (default: 123456)
  --password <password>      Alias for --web-password
  --language <lang>          Interface language: zh|en|ja|ko|fr|de
  --lang <lang>              Alias for --language

Configuration Priority (highest to lowest):
  1. CLI arguments (these options)
  2. Workspace .env file (./.hyperchat/.env)  
  3. Global .env file (~/Documents/HyperChat/.env)
  4. System environment variables (process.env)
  5. Default values

Examples:
  hyperchat serve --port 8080 --verbose --env development
  hyperchat chat --ai-provider openai --ai-model gpt-4
  hyperchat chat --data-dir /custom/path --quiet`;
  }
}

/**
 * 便捷函数：解析当前进程的命令行参数
 */
export function parseCurrentArgs(): Partial<EnvConfig> {
  return CliArgsParser.parseArgs(process.argv.slice(2));
}

/**
 * 便捷函数：从选项对象解析环境配置
 */
export function parseOptionsToEnv(options: Record<string, any>): Partial<EnvConfig> {
  return CliArgsParser.parseOptions(options);
}

/**
 * CLI选项定义接口
 */
export interface CliOptionDefinition {
  long: string;    // 长选项名，如 'agent'
  short?: string;  // 短选项名，如 'a'  
  hasValue: boolean; // 是否需要值
}

/**
 * 通用CLI参数解析器
 * 用于解析特定命令的选项
 */
export class GenericCliParser {
  /**
   * 解析指定的CLI选项
   * @param args 完整的命令行参数数组
   * @param options 要解析的选项定义
   * @returns 解析结果对象
   */
  static parseArgs(args: string[], options: CliOptionDefinition[]): Record<string, string | boolean> {
    const result: Record<string, string | boolean> = {};
    
    // 创建选项映射
    const optionMap = new Map<string, CliOptionDefinition>();
    for (const option of options) {
      optionMap.set(`--${option.long}`, option);
      if (option.short) {
        optionMap.set(`-${option.short}`, option);
      }
    }
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const optionDef = optionMap.get(arg);
      
      if (!optionDef) {
        continue;
      }
      
      if (optionDef.hasValue) {
        // 需要值的选项
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          result[optionDef.long] = nextArg;
          i++; // 跳过值参数
        }
      } else {
        // 布尔标志选项
        result[optionDef.long] = true;
      }
    }
    
    return result;
  }
}