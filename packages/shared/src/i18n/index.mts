/**
 * HyperChat i18n 统一入口 - 简化版本
 * 
 * 提供纯粹的i18n核心功能，不包含平台相关逻辑
 */

// 导出核心类型
export type { Language, TranslationData, I18nConfig } from './types.mjs';

// 导出核心函数
export { 
  initI18n, 
  t, 
  setCurrLang, 
  getCurrLang, 
  getTranslations, 
  getCollectedTexts, 
  clearCollectedTexts,
  addTranslations,
  updateLanguage,
  isI18nInitialized,
  currLang
} from './core.mjs';

// 导出翻译数据
export { translations } from './translations.mjs';