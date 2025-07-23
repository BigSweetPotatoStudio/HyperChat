/**
 * 环境变量管理系统使用示例
 * 展示如何在 CLI 命令中使用新的优先级叠加系统
 */

import { EnvManager } from "../data/managers/envManager.mjs";
import { parseCurrentArgs, CliArgsParser } from "../utils/cliArgsParser.mjs";

/**
 * 示例：CLI 命令中使用环境变量管理器
 */
export function exampleCliCommand() {
  // 1. 解析 CLI 参数
  const cliArgs = parseCurrentArgs();
  console.log("Parsed CLI args:", cliArgs);

  // 2. 获取环境管理器实例（包含 CLI 参数覆盖）
  const envManager = EnvManager.getInstance(process.cwd(), cliArgs);

  // 3. 使用环境配置
  const config = envManager.getConfig();
  
  console.log(`Server will run on port: ${config.HyperChat_HTTP_PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Log level: ${config.LOG_LEVEL}`);

  // 4. 显示详细的配置层次信息
  envManager.logDetailedConfig();
}

/**
 * 示例：在 serve 命令中使用
 */
export function exampleServeCommand(options: {
  port?: number;
  verbose?: boolean;
  workspace?: string;
}) {
  // 1. 将选项转换为环境配置
  const cliArgs = CliArgsParser.parseOptions(options);
  
  // 2. 获取环境管理器（支持工作区和 CLI 参数）
  const envManager = EnvManager.getInstance(options.workspace, cliArgs);
  
  // 3. 获取最终配置
  const config = envManager.getConfig();
  
  console.log("=== Server Configuration ===");
  console.log(`Port: ${config.HyperChat_HTTP_PORT}`);
  console.log(`Workspace: ${options.workspace || 'global'}`);
  console.log(`Log Level: ${config.LOG_LEVEL}`);
  
  if (envManager.isDevelopment()) {
    console.log("🔧 Development mode enabled");
  }
  
  // 显示配置来源
  envManager.logDetailedConfig();
}

/**
 * 示例：显示帮助信息
 */
export function showEnvHelp() {
  console.log("\n" + CliArgsParser.getHelpText());
  
  console.log("\nConfiguration Priority (high to low):");
  console.log("1. CLI Arguments (highest priority)");
  console.log("2. Workspace .hyperchat/.env");  
  console.log("3. Global ~/.hyperchat/.env");
  console.log("4. System environment variables");
  console.log("5. Default values (lowest priority)");
  
  console.log("\nExamples:");
  console.log("  # Use different port and verbose logging");
  console.log("  hyperchat serve --port 8080 --verbose");
  console.log("");
  console.log("  # Override environment and API settings");
  console.log("  hyperchat chat --env development --ai-provider openai");
  console.log("");
  console.log("  # Quiet mode with custom workspace");
  console.log("  hyperchat run --quiet --workspace /path/to/project");
}

// 如果直接运行此文件，显示示例
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  console.log("🚀 HyperChat Environment Management System Example\n");
  
  // 显示帮助
  showEnvHelp();
  
  // 运行示例
  console.log("\n" + "=".repeat(50));
  console.log("Running CLI example with current args...");
  exampleCliCommand();
}