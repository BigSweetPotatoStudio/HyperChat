/**
 * HyperChat 内置提示词
 * 全面的本地AI助手，具备完整的开发和系统操作能力
 */

import os from 'os';
import process from 'process';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { appDataDir } from '../const.mjs';

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  totalMemory: number;
  freeMemory: number;
  cpus: os.CpuInfo[];
  hostname: string;
  uptime: number;
  currentUser: string;
  homeDir: string;
  tmpDir: string;
  envInfo: Record<string, string>;
}

interface AgentMemoryResult {
  content: string;
  filePath: string;
}

interface BuiltinPromptsResult {
  prompt: string;
}

/**
 * 格式化内存大小（字节转GB）
 */
function formatMemoryGB(bytes: number): number {
  return Math.round(bytes / 1024 / 1024 / 1024);
}

/**
 * 格式化运行时间（秒转小时）
 */
function formatUptimeHours(seconds: number): number {
  return Math.round(seconds / 3600);
}

/**
 * 安全获取系统信息
 */
function getSystemInfoSafe(): SystemInfo {
  try {
    const cpus = os.cpus();
    const userInfo = os.userInfo();
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: formatMemoryGB(os.totalmem()),
      freeMemory: formatMemoryGB(os.freemem()),
      cpus,
      hostname: os.hostname(),
      uptime: formatUptimeHours(os.uptime()),
      currentUser: userInfo.username,
      homeDir: os.homedir(),
      tmpDir: os.tmpdir(),
      envInfo: {
        PATH: process.env.PATH ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV || 'Not set',
        SHELL: process.env.SHELL || 'Not set',
        TERM: process.env.TERM || 'Not set'
      }
    };
  } catch (error) {
    console.warn('Failed to get system info:', error);
    throw new Error('System information unavailable');
  }
}

/**
 * 格式化系统信息为Markdown字符串
 */
function formatSystemInfo(systemInfo: SystemInfo, workspacePath: string): string {
  const cpuModel = systemInfo.cpus[0]?.model || 'Unknown';
  const cpuCount = systemInfo.cpus.length;
  const memoryUsagePercent = systemInfo.totalMemory > 0 
    ? Math.round((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory * 100)
    : 0;

  return `## 🖥️ 系统环境信息

### 基础系统信息
- **操作系统**: ${systemInfo.platform} (${systemInfo.arch})
- **主机名**: ${systemInfo.hostname}
- **当前用户**: ${systemInfo.currentUser}
- **系统运行时间**: ${systemInfo.uptime} 小时
- **Node.js 版本**: ${systemInfo.nodeVersion}

### 硬件资源
- **CPU**: ${cpuModel}
- **CPU 核心数**: ${cpuCount}
- **总内存**: ${systemInfo.totalMemory} GB
- **可用内存**: ${systemInfo.freeMemory} GB
- **内存使用率**: ${memoryUsagePercent}%

### 目录路径
- **用户主目录**: ${systemInfo.homeDir}
- **临时目录**: ${systemInfo.tmpDir}
- **当前工作目录**: ${workspacePath}

### 环境变量状态
- **PATH**: ${systemInfo.envInfo.PATH}
- **NODE_ENV**: ${systemInfo.envInfo.NODE_ENV}
- **SHELL**: ${systemInfo.envInfo.SHELL}
- **TERM**: ${systemInfo.envInfo.TERM}

---
`;
}

/**
 * 根据 agentScope 获取记忆内容和路径
 */
function getAgentMemory(workspacePath: string, agentName: string, agentScope: "global" | "workspace"): AgentMemoryResult {
  if (!agentName?.trim()) {
    return { content: "", filePath: "" };
  }

  const memoryPath = agentScope === "global"
    ? path.join(appDataDir, ".hyperchat", "agents", agentName, "memory.md")
    : path.join(workspacePath, ".hyperchat", "agents", agentName, "memory.md");

  let memoryContent = "";
  if (existsSync(memoryPath)) {
    try {
      memoryContent = readFileSync(memoryPath, 'utf-8');
    } catch (error) {
      console.warn(`Failed to read memory file: ${memoryPath}`, error);
      memoryContent = `❌ 记忆文件读取失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }

  return {
    content: memoryContent,
    filePath: memoryPath
  };
}

/**
 * 格式化Agent记忆信息
 */
function formatAgentMemory(agentMemory: AgentMemoryResult, agentScope: "global" | "workspace"): string {
  const scopeText = agentScope === "global" ? "全局" : "工作区";
  
  if (agentMemory.content.trim()) {
    return `
## 🧠 Agent 记忆

**作用域**: ${scopeText}
**记忆文件路径**: ${agentMemory.filePath}

### 记忆内容:
${agentMemory.content}

---
`;
  } else {
    return `
## 🧠 Agent 记忆

**作用域**: ${scopeText}
**记忆文件路径**: ${agentMemory.filePath}
**状态**: 暂无记忆内容

---
`;
  }
}

/**
 * 构建核心提示词模板
 */
const CORE_PROMPT_TEMPLATE = `
你是一个功能强大的本地AI助手，运行在用户的本地环境中，具备完整的系统访问权限和开发能力。

## 🌍 本地环境认知

- 始终记住当前工作目录和项目结构
- 理解系统环境、开发工具和权限限制
- 监控资源使用和运行状态

## 🛠️ 核心能力

- 📁 **文件系统**：文件/目录操作、内容搜索、批量处理
- 💻 **代码开发**：多语言支持、项目管理、代码审查、测试
- 📝 **脚本编写**：可以编写Node.js脚本来辅助完成复杂任务，默认保存在scripts/目录下
- ⚡ **系统操作**：Shell命令、进程管理、网络操作、环境配置
- 🌐 **网络资源**：通过curl/wget获取数据、API调用、信息搜索、资源下载
- 🔧 **开发工具**：Git、构建系统、容器化、云服务、数据库

## 🎯 工作原则

- 🛡️ **安全第一**：危险操作前确认，保护数据和隐私
- 🎯 **上下文保持**：理解项目结构，记住操作历史
- ⚡ **效率优先**：选择最佳工具，批量处理任务
- 📍 **路径感知**：始终使用正确路径，适配环境

## 📋 交互模式

- 🚀 **快速执行**：直接解决问题，立即执行简单操作
- 🔍 **详细分析**：提供完整分析和多种方案
- ✅ **确认模式**：复杂或风险操作前请求确认

## 🚀 任务流程

1. 🔍 **环境检查** → 2. 🎯 **需求分析** → 3. 🛠️ **方案设计** → 4. ⚡ **执行实施** → 5. ✅ **结果验证**

---

## 🎯 开始工作

**我已经准备好在你的本地环境中工作！**

当前我可以：
- 🗂️ 浏览和操作文件系统
- 💻 编写和执行代码
- 📝 编写Node.js脚本辅助任务处理（默认保存在scripts/目录）
- ⚡ 运行系统命令
- 🌐 通过curl/wget访问网络资源
- 🔍 搜索和分析信息

**请告诉我你的工作目录和需要完成的任务，我将充分利用本地环境的所有能力来帮助你实现目标！** 

*提示：你可以直接说"在当前目录中..."或"帮我在项目根目录..."，我会自动理解和适应你的工作环境。*
`;

/**
 * 获取所有可用的内置提示词
 */
export function getBuiltinPrompts(workspacePath: string, systemPrompt: string): BuiltinPromptsResult;
export function getBuiltinPrompts(workspacePath: string, systemPrompt: string, agentName: string, agentScope: "global" | "workspace"): BuiltinPromptsResult;
export function getBuiltinPrompts(
  workspacePath: string, 
  systemPrompt: string, 
  agentName?: string, 
  agentScope?: "global" | "workspace"
): BuiltinPromptsResult {
  try {
    // 获取系统信息
    const systemInfo = getSystemInfoSafe();
    const systemInfoStr = formatSystemInfo(systemInfo, workspacePath);

    // 获取Agent记忆信息（如果提供）
    let memoryStr = "";
    if (agentName && agentScope) {
      const agentMemory = getAgentMemory(workspacePath, agentName, agentScope);
      memoryStr = formatAgentMemory(agentMemory, agentScope);
    }

    // 构建完整提示词
    const prompt = `${systemInfoStr}${memoryStr}${CORE_PROMPT_TEMPLATE}

# 用户自定义提示词
${systemPrompt}
`;

    return { prompt };
  } catch (error) {
    console.error('Failed to generate builtin prompts:', error);
    // fallback 提示词
    return {
      prompt: `${CORE_PROMPT_TEMPLATE}

# 用户自定义提示词
${systemPrompt}

⚠️ 注意：系统信息获取失败，部分功能可能受限。
`
    };
  }
}
