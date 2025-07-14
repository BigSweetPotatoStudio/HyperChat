/**
 * HyperChat CLI i18n 初始化模块 - 基于shared包
 * 
 * 功能：
 * 1. 集成shared包的i18n系统
 * 2. 从AppSettings读取语言设置
 * 3. 支持环境变量语言设置
 * 4. CLI专用的语言检测
 */

import { 
  initI18n, 
  t, 
  setCurrLang, 
  getCurrLang, 
  updateLanguage,
  translations,
  addTranslations,
  type Language 
} from '@dadigua/hyperchat-shared';
import { Command } from './command.mjs';

// i18n系统初始化状态
let isInitialized = false;

/**
 * 从环境变量获取语言设置
 */
function getLanguageFromEnv(): Language | null {
  const envLang = process.env.HYPERCHAT_LANG || process.env.LANG || process.env.LANGUAGE || '';
  
  // 支持中文的语言环境
  if (envLang.includes('zh_CN') || envLang.includes('zh-CN') || 
      envLang.includes('zh_TW') || envLang.includes('zh-TW')) {
    return "zhCN";
  }
  
  // 支持英文的语言环境
  if (envLang.includes('en_US') || envLang.includes('en-US') || 
      envLang.includes('en_GB') || envLang.includes('en-GB')) {
    return "enUS";
  }
  
  return null;
}

/**
 * 检测系统默认语言
 */
function detectSystemLanguage(): Language {
  const envLang = getLanguageFromEnv();
  if (envLang) {
    return envLang;
  }
  
  // 默认使用中文（符合项目特性）
  return "zhCN";
}

/**
 * 初始化CLI i18n系统
 */
export async function initCliI18n(): Promise<void> {
  if (isInitialized) {
    return;
  }

  let currentLanguage: Language;

  try {
    // 1. 优先从AppSettings获取语言设置
    const appSettings = await Command.getAppSettings();
    currentLanguage = appSettings?.appearance?.language || detectSystemLanguage();
  } catch (error) {
    // 2. 如果AppSettings加载失败，使用环境变量或系统检测
    currentLanguage = getLanguageFromEnv() || detectSystemLanguage();
  }

  // 初始化shared i18n系统
  initI18n({
    currentLanguage,
    translations,
    autoCollect: process.env.NODE_ENV === 'development' || process.env.HYPERCHAT_DEV === 'true',
    onLanguageChange: async (lang: Language) => {
      // 异步更新AppSettings
      try {
        // 获取当前设置，只更新language字段
        const currentSettings = await Command.getAppSettings();
        await Command.updateAppSettings({
          updates: {
            appearance: { 
              ...currentSettings.appearance,
              language: lang 
            }
          }
        });
      } catch (error) {
        console.error('Failed to update language in AppSettings:', error);
      }
    }
  });

  isInitialized = true;
}

/**
 * 添加CLI专用的翻译文本
 */
export function addCliTranslations(): void {
  const cliTranslations = {
    // CLI专用翻译
    "Getting agent list...": {
      "zh": "获取代理列表..."
    },
    "Agent list:": {
      "zh": "代理列表:"
    },
    "No agents available": {
      "zh": "暂无代理"
    },
    "Create a new agent with: hyperchat agent create <name>": {
      "zh": "使用以下命令创建新代理: hyperchat agent create <name>"
    },
    "Agent created successfully": {
      "zh": "代理创建成功"
    },
    "Welcome to HyperChat CLI! 🎉": {
      "zh": "欢迎使用 HyperChat CLI! 🎉"
    },
    "Type your message...": {
      "zh": "输入您的消息..."
    },
    "Exit": {
      "zh": "退出"
    },
    "Workspace created successfully": {
      "zh": "工作区创建成功"
    },
    "This directory is already a workspace": {
      "zh": "此目录已经是工作区"
    },
    // 服务器相关
    "Starting HyperChat server...": {
      "zh": "启动 HyperChat 服务器..."
    },
    "Press Ctrl+C to stop": {
      "zh": "按 Ctrl+C 停止服务器"
    },
    "Starting core service...": {
      "zh": "启动核心服务..."
    },
    "Core service is running": {
      "zh": "核心服务正在运行"
    },
    "Service stopped": {
      "zh": "服务已停止"
    },
    // 任务相关
    "Task list:": {
      "zh": "任务列表:"
    },
    "No tasks found": {
      "zh": "未找到任务"
    },
    "Task created successfully": {
      "zh": "任务创建成功"
    },
    "Task updated successfully": {
      "zh": "任务更新成功"
    },
    "Task deleted successfully": {
      "zh": "任务删除成功"
    },
    "Task enabled successfully": {
      "zh": "任务启用成功"
    },
    "Task disabled successfully": {
      "zh": "任务禁用成功"
    },
    "Task triggered successfully": {
      "zh": "任务触发成功"
    },
    // CLI常用消息
    "Please provide agent subcommand": {
      "zh": "请提供agent子命令"
    },
    "Available commands: list, create, delete, <name> \"message\", <name> chat": {
      "zh": "可用命令: list, create, delete, <name> \"message\", <name> chat"
    },
    "Workspace status:": {
      "zh": "工作区状态:"
    },
    "Agent deleted successfully": {
      "zh": "代理删除成功"
    },
    "Available commands: create": {
      "zh": "可用命令: create"
    },
    // 错误和警告
    "Error": {
      "zh": "错误"
    },
    "Warning": {
      "zh": "警告"
    }
  };

  addTranslations(cliTranslations);
}

/**
 * 从AppSettings更新语言（当AppSettings在其他地方被更新时调用）
 */
export function syncLanguageFromAppSettings(language: Language): void {
  if (getCurrLang() !== language) {
    updateLanguage(language);
  }
}

// 导出shared包的函数，保持API兼容
export { t, setCurrLang, getCurrLang };