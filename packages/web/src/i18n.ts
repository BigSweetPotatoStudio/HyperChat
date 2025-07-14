/**
 * HyperChat Web前端 i18n 初始化模块 - 基于shared包
 * 
 * 功能：
 * 1. 集成shared包的i18n系统
 * 2. 与AppSettings联动的语言设置
 * 3. localStorage备份机制
 * 4. 开发模式调试支持
 */

import { 
  initI18n, 
  t, 
  setCurrLang, 
  getCurrLang, 
  updateLanguage,
  translations,
  type Language 
} from '@dadigua/hyperchat-shared';
import { call } from "./common/call";

// i18n系统初始化状态
let isInitialized = false;

/**
 * 从localStorage获取备份语言设置
 */
function getLanguageFromLocalStorage(): Language | null {
  try {
    const saved = localStorage.getItem("currLang");
    return saved as Language | null;
  } catch (error) {
    return null;
  }
}

/**
 * 保存语言设置到localStorage
 */
function saveLanguageToLocalStorage(lang: Language): void {
  try {
    localStorage.setItem("currLang", lang);
  } catch (error) {
    console.warn('Failed to save language to localStorage:', error);
  }
}

/**
 * 检测浏览器默认语言
 */
function detectBrowserLanguage(): Language {
  return navigator.language === "zh-CN" ? "zhCN" : "enUS";
}

/**
 * 初始化Web前端i18n系统
 */
export async function initWebI18n(): Promise<void> {
  if (isInitialized) {
    return;
  }

  let currentLanguage: Language;

  try {
    // 1. 优先从AppSettings获取语言设置
    const appSettings = await call('getAppSettings');
    currentLanguage = appSettings?.appearance?.language || 'zhCN';
  } catch (error) {
    // 2. 如果AppSettings加载失败，从localStorage获取
    currentLanguage = getLanguageFromLocalStorage() || detectBrowserLanguage();
  }

  // 初始化shared i18n系统
  initI18n({
    currentLanguage,
    translations,
    autoCollect: process.env.NODE_ENV === 'development',
    onLanguageChange: async (lang: Language) => {
      // 保存到localStorage（立即生效）
      saveLanguageToLocalStorage(lang);
      
      // 异步更新AppSettings
      try {
        // 获取当前设置，只更新language字段
        const currentSettings = await call('getAppSettings');
        await call('updateAppSettings', {
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


// 导出shared包的函数，保持API兼容
export { t, setCurrLang, getCurrLang };

// 为了向后兼容，导出currLang（从shared包导入动态版本）
export { currLang } from '@dadigua/hyperchat-shared';