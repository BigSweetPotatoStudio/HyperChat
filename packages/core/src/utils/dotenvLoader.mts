import * as fs from "fs";
import * as path from "path";
import { Logger } from "../log.mjs";

/**
 * 简单的 .env 文件解析器
 * 支持基本的键值对格式，不依赖外部库
 */
export class DotenvLoader {
  
  /**
   * 解析 .env 文件内容
   */
  private static parseEnvContent(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      // 跳过空行和注释
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // 解析键值对
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }

    return result;
  }

  /**
   * 加载单个 .env 文件
   */
  public static loadEnvFile(filePath: string): Record<string, string> {
    try {
      if (!fs.existsSync(filePath)) {
        return {};
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = this.parseEnvContent(content);
      
      Logger.debug(`Loaded .env file: ${filePath}`, {
        keysCount: Object.keys(parsed).length,
        keys: Object.keys(parsed)
      });

      return parsed;
    } catch (error) {
      Logger.warn(`Failed to load .env file: ${filePath}`, error);
      return {};
    }
  }

  /**
   * 按优先级叠加多个 .env 文件
   * @param filePaths 文件路径数组，后面的文件优先级更高
   */
  public static loadEnvFiles(filePaths: string[]): Record<string, string> {
    let result: Record<string, string> = {};

    for (const filePath of filePaths) {
      const envData = this.loadEnvFile(filePath);
      result = { ...result, ...envData };
    }

    return result;
  }

  /**
   * 获取标准的 .env 文件路径列表（按优先级排序）
   */
  public static getStandardEnvPaths(workspacePath?: string): string[] {
    const paths: string[] = [];

    // 1. 项目根目录的 .env
    const rootEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(rootEnvPath)) {
      paths.push(rootEnvPath);
    }

    // 2. 全局 .hyperchat/.env
    const globalPath = path.join(process.env.HOME || process.env.USERPROFILE || '', 'Documents', 'HyperChat', '.hyperchat', '.env');
    if (fs.existsSync(globalPath)) {
      paths.push(globalPath);
    }

    // 3. 工作区 .hyperchat/.env (最高优先级)
    if (workspacePath) {
      const workspaceEnvPath = path.join(workspacePath, '.hyperchat', '.env');
      if (fs.existsSync(workspaceEnvPath)) {
        paths.push(workspaceEnvPath);
      }
    }

    return paths;
  }

  /**
   * 创建示例 .env 文件
   */
  public static createExampleEnv(targetPath: string): void {
    const exampleContent = `# HyperChat Environment Configuration
# This file will be loaded with high priority

# Basic Configuration
NODE_ENV=development
HyperChat_MY_ENV=dev

# Service Configuration  
HyperChat_HTTP_PORT=16100

# API Configuration (Optional)
# HyperChat_API_KEY=your_api_key_here
# HyperChat_API_URL=your_api_url_here
# HyperChat_AI_Provider=openai
# HyperChat_AI_Model=gpt-4

# Logging
LOG_LEVEL=info
`;

    try {
      // 确保目录存在
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(targetPath, exampleContent, 'utf8');
      Logger.info(`Created example .env file: ${targetPath}`);
    } catch (error) {
      Logger.error(`Failed to create example .env file: ${targetPath}`, error);
    }
  }
}