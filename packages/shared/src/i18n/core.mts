/**
 * HyperChat i18n 核心模块 - 简化版本
 * 
 * 功能：
 * 1. 统一的翻译函数 t`template string`
 * 2. 简单的语言设置管理
 * 3. 开发模式自动收集未翻译文本
 * 4. 通过回调与外部系统同步
 */

import type { Language, TranslationData, I18nConfig } from './types.mjs';

// 全局状态
let currentLanguage: Language = 'enUS'; // 默认语言为英文
let translationData: TranslationData = {};
let onLanguageChangeCallback: ((lang: Language) => void | Promise<void>) | undefined;
let autoCollectEnabled = false;
let isInitialized = false;


/**
 * 初始化 i18n 系统
 */
export function initI18n(config: I18nConfig): void {
  currentLanguage = config.currentLanguage;
  translationData = { ...config.translations };
  onLanguageChangeCallback = config.onLanguageChange;
  autoCollectEnabled = config.autoCollect || false;
  isInitialized = true;
}

/**
 * 检查是否包含英文字符
 */
function hasEnglish(str: string): boolean {
  return /[a-zA-Z]/.test(str);
}

/**
 * 国际化翻译函数 - 支持模板字符串语法
 * 使用方式：t`Hello ${name}!` 或 t`Welcome to HyperChat`
 */
export function t(strings: TemplateStringsArray, ...values: any[]): string {
  // 将模板字符串重新组合成完整字符串
  let str = strings.reduce(
    (result: string, str: string, i: number) => result + str + (values[i] || ""),
    "",
  );
  try {
    // 根据当前语言返回对应翻译
    if (currentLanguage === "zhCN") {
      return translationData[str].zh || str;  // 返回中文翻译，如果没有则返回原文
    } else {
      return translationData[str].en || str;  // 返回英文原文，如果没有则返回原文
    }
  } catch (e) { 
    return str; // 如果出错，返回原文
  }
}

/**
 * 设置当前语言
 */
export async function setCurrLang(lang: Language): Promise<void> {
  if (!isInitialized) {
    throw new Error('i18n system not initialized. Call initI18n() first.');
  }

  currentLanguage = lang;

  // 调用回调函数（如果有）
  if (onLanguageChangeCallback) {
    try {
      await onLanguageChangeCallback(lang);
    } catch (error) {
      console.error('Language change callback failed:', error);
    }
  }
}

/**
 * 获取当前语言
 */
export function getCurrLang(): Language {
  return currentLanguage;
}

/**
 * 获取当前翻译数据（调试用）
 */
export function getTranslations(): TranslationData {
  return { ...translationData };
}



/**
 * 添加翻译数据（运行时动态添加）
 */
export function addTranslations(newTranslations: TranslationData): void {
  translationData = { ...translationData, ...newTranslations };
}

/**
 * 更新语言设置（无回调版本，用于外部系统主动更新）
 */
export function updateLanguage(lang: Language): void {
  currentLanguage = lang;
}

/**
 * 检查 i18n 系统是否已初始化
 */
export function isI18nInitialized(): boolean {
  return isInitialized;
}

// 为了向后兼容，导出 currLang 属性
export const currLang = new Proxy({} as { value: Language }, {
  get(target, prop) {
    if (prop === 'value' || prop === 'toString') {
      return currentLanguage;
    }
    return currentLanguage;
  }
});