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
  const browserLang = navigator.language.toLowerCase();
  
  // 检测中文
  if (browserLang.startsWith('zh')) {
    return "zh";
  }
  
  // 检测日语
  if (browserLang.startsWith('ja')) {
    return "ja";
  }
  
  // 检测韩语
  if (browserLang.startsWith('ko')) {
    return "ko";
  }
  
  // 检测法语
  if (browserLang.startsWith('fr')) {
    return "fr";
  }
  
  // 检测德语
  if (browserLang.startsWith('de')) {
    return "de";
  }
  
  // 默认返回英语
  return "en";
}

/**
 * 初始化Web前端i18n系统
 */
export async function initWebI18n(): Promise<void> {
  if (isInitialized) {
    return;
  }

  let currentLanguage: Language;

  // 语言设置已移动到环境变量系统，Web端从localStorage或浏览器检测获取
  // TODO: 后续可以考虑从后端环境变量系统获取语言设置
  currentLanguage = getLanguageFromLocalStorage() || detectBrowserLanguage();

  // 初始化shared i18n系统
  initI18n({
    currentLanguage,
    translations,
    autoCollect: process.env.NODE_ENV === 'development',
    onLanguageChange: async (lang: Language) => {
      // 保存到localStorage（立即生效）
      saveLanguageToLocalStorage(lang);
      
      // 语言设置已移动到环境变量系统，Web端暂时只保存到localStorage
      // TODO: 后续可以考虑通过API将语言设置保存到后端环境变量系统
      console.debug(`Language changed to: ${lang} (saved to localStorage)`);
    }
  });


  isInitialized = true;
}


// 导出shared包的函数，保持API兼容
export { t, setCurrLang, getCurrLang };

// 为了向后兼容，导出currLang（从shared包导入动态版本）
export { currLang } from '@dadigua/hyperchat-shared';