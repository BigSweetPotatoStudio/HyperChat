/**
 * HyperChat_AppDataDir 环境变量使用示例
 * 展示如何通过 CLI 参数和环境变量自定义全局配置目录
 */

import { EnvManager } from "../data/managers/envManager.mjs";
import { CliArgsParser } from "../utils/cliArgsParser.mjs";

/**
 * 示例 1: 通过 CLI 参数指定自定义数据目录
 */
export function exampleWithCliArgs() {
  console.log("🔧 Example 1: Using CLI args to set custom AppDataDir\n");

  // 模拟 CLI 参数: --data-dir /tmp/hyperchat-test
  const mockCliArgs = CliArgsParser.parseOptions({
    dataDir: '/tmp/hyperchat-test',
    verbose: true
  });

  console.log("Parsed CLI args:", mockCliArgs);

  // 创建环境管理器实例
  const envManager = EnvManager.getInstance(process.cwd(), mockCliArgs);
  
  console.log("📍 Global data directory:", envManager.getActualGlobalDataDir());
  console.log("📄 Global .env file path:", envManager.getActualGlobalEnvPath());
  
  // 显示详细配置信息
  envManager.logDetailedConfig();
}

/**
 * 示例 2: 通过环境变量指定自定义数据目录
 */
export function exampleWithEnvVar() {
  console.log("\n" + "=".repeat(60));
  console.log("🌍 Example 2: Using environment variable\n");

  // 临时设置环境变量
  const originalValue = process.env.HyperChat_AppDataDir;
  process.env.HyperChat_AppDataDir = '/home/user/my-hyperchat-config';

  try {
    // 创建新的环境管理器实例
    const envManager = EnvManager.getInstance();
    
    console.log("📍 Global data directory:", envManager.getActualGlobalDataDir());
    console.log("📄 Global .env file path:", envManager.getActualGlobalEnvPath());
    
    // 显示配置层次
    const loadInfo = envManager.getLoadInfo();
    console.log("\n📋 Configuration layers:");
    loadInfo.forEach((info, index) => {
      console.log(`  ${index + 1}. ${info.source}${info.path ? ` (${info.path})` : ''}`);
      if (info.loadedKeys.includes('HyperChat_AppDataDir')) {
        console.log(`     ✅ Contains AppDataDir setting`);
      }
    });

  } finally {
    // 恢复原始环境变量
    if (originalValue !== undefined) {
      process.env.HyperChat_AppDataDir = originalValue;
    } else {
      delete process.env.HyperChat_AppDataDir;
    }
  }
}

/**
 * 示例 3: 优先级演示 - CLI 参数覆盖环境变量
 */
export function examplePriorityOverride() {
  console.log("\n" + "=".repeat(60));
  console.log("🏆 Example 3: Priority override demonstration\n");

  // 设置环境变量
  const originalValue = process.env.HyperChat_AppDataDir;
  process.env.HyperChat_AppDataDir = '/env/hyperchat';

  try {
    // CLI 参数会覆盖环境变量
    const cliArgs = CliArgsParser.parseOptions({
      appDataDir: '/cli/hyperchat',
      port: 8080
    });

    const envManager = EnvManager.getInstance(undefined, cliArgs);
    
    console.log("🌍 Environment variable set to:", process.env.HyperChat_AppDataDir);
    console.log("⚡ CLI argument set to:", cliArgs.HyperChat_AppDataDir);
    console.log("🎯 Final resolved path:", envManager.getActualGlobalDataDir());
    console.log("🏅 Winner: CLI argument (highest priority)");
    
    // 显示完整的配置层次
    envManager.logDetailedConfig();

  } finally {
    // 恢复环境变量
    if (originalValue !== undefined) {
      process.env.HyperChat_AppDataDir = originalValue;
    } else {
      delete process.env.HyperChat_AppDataDir;
    }
  }
}

/**
 * 示例 4: 创建自定义路径的配置文件
 */
export function exampleCreateCustomConfig() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Example 4: Creating config files in custom directory\n");

  const customDir = '/tmp/hyperchat-demo';
  const cliArgs = CliArgsParser.parseOptions({
    dataDir: customDir
  });

  const envManager = EnvManager.getInstance(undefined, cliArgs);
  
  console.log(`📁 Creating example .env file in: ${customDir}`);
  
  try {
    // 创建全局 .env 示例文件
    envManager.createGlobalEnvExampleAtCurrentPath();
    console.log("✅ Global .env example created successfully");
    
    // 也可以静态方法创建
    EnvManager.createGlobalEnvExample(customDir);
    console.log("✅ Alternative creation method also works");
    
  } catch (error) {
    console.error("❌ Error creating config files:", error);
  }
}

/**
 * 显示所有使用场景的帮助信息
 */
export function showAppDataDirHelp() {
  console.log(`
🏠 HyperChat AppDataDir Configuration Guide

The HyperChat_AppDataDir environment variable allows you to customize where
HyperChat stores its global configuration files.

📍 Default Location:
  ~/Documents/HyperChat/

🔧 Setting Custom Location:

1️⃣  Via CLI Arguments (Highest Priority):
   hyperchat serve --data-dir /custom/path
   hyperchat run --app-data-dir /custom/path

2️⃣  Via Environment Variable:
   export HyperChat_AppDataDir=/custom/path
   hyperchat serve

3️⃣  Via .env File:
   # In project root .env or workspace .env
   HyperChat_AppDataDir=/custom/path

📂 Directory Structure:
  {AppDataDir}/
  ├── .hyperchat/
  │   ├── .env              # Global environment overrides
  │   ├── mcp.json          # MCP configuration
  │   └── agents/           # Global agents
  │       └── ...
  └── ...

🎯 Use Cases:
  • Portable installations
  • Multi-user environments  
  • Custom deployment paths
  • Development/testing setups

⚡ Priority Order (high to low):
  1. CLI arguments (--data-dir, --app-data-dir)
  2. Workspace .hyperchat/.env
  3. Global .hyperchat/.env
  4. System environment variables
  5. Default: ~/Documents/HyperChat
`);
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  console.log("🚀 HyperChat AppDataDir Configuration Examples\n");
  
  // 显示帮助信息
  showAppDataDirHelp();
  
  // 运行所有示例
  exampleWithCliArgs();
  exampleWithEnvVar();
  examplePriorityOverride();
  exampleCreateCustomConfig();
  
  console.log("\n" + "🎉 All examples completed!".padStart(60));
}