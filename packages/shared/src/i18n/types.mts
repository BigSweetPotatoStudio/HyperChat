/**
 * HyperChat i18n 类型定义 - 简化版本
 * 
 * 保持shared包的简洁性，只定义核心类型
 */

// 支持的语言类型
export type Language = "zhCN" | "enUS";

// 翻译数据结构
export interface TranslationData {
  [key: string]: {
    zh?: string;  // 中文翻译
    en?: string;  // 英文原文（可选，默认使用key）
  };
}

// i18n 配置接口
export interface I18nConfig {
  /**
   * 当前语言
   */
  currentLanguage: Language;
  
  /**
   * 翻译数据
   */
  translations: TranslationData;
  
  /**
   * 是否在开发模式下自动收集未翻译文本
   */
  autoCollect?: boolean;
  
  /**
   * 语言设置回调函数（用于与外部系统同步）
   */
  onLanguageChange?: (lang: Language) => void | Promise<void>;
}