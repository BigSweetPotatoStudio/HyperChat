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

  // 默认使用英文
  return "enUS"; // 可以根据需要调整默认语言
}

/**
 * 初始化CLI i18n系统
 */
export async function initCliI18n(commandLineLanguage?: string): Promise<void> {
  if (isInitialized) {
    return;
  }

  let currentLanguage: Language;

  // 优先级: 命令行参数 > AppSettings > 环境变量 > 系统检测
  if (commandLineLanguage) {
    // 1. 最高优先级：命令行参数 --language
    const langInput = commandLineLanguage.toLowerCase();
    if (langInput === 'zh' || langInput === 'zhcn' || langInput === 'cn') {
      currentLanguage = 'zhCN';
    } else if (langInput === 'en' || langInput === 'enus' || langInput === 'us') {
      currentLanguage = 'enUS';
    } else {
      console.warn(`⚠️  Unsupported language from command line: ${commandLineLanguage}, using default`);
      currentLanguage = detectSystemLanguage();
    }
  } else {
    try {
      // 2. 从AppSettings获取语言设置
      const appSettings = await Command.getAppSettings();
      currentLanguage = appSettings?.appearance?.language || detectSystemLanguage();
    } catch (error) {
      // 3. 如果AppSettings加载失败，使用环境变量或系统检测
      currentLanguage = getLanguageFromEnv() || detectSystemLanguage();
    }
  }

  // 初始化shared i18n系统
  initI18n({
    currentLanguage,
    translations,
    autoCollect: true,
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
 * 从AppSettings更新语言（当AppSettings在其他地方被更新时调用）
 */
export function syncLanguageFromAppSettings(language: Language): void {
  if (getCurrLang() !== language) {
    updateLanguage(language);
  }
}


// 导出shared包的函数，保持API兼容
export { t, setCurrLang, getCurrLang };