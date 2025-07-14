/**
 * HyperChat i18n 类型定义 - 简化版本
 * 
 * 保持shared包的简洁性，只定义核心类型
 */

// 支持的语言类型
export type Language = "zh" | "en" | "ja" | "ko" | "fr" | "de";

// 翻译数据结构
export interface TranslationData {
  [key: string]: {
    zh?: string | null;  // 中文翻译
    ja?: string | null;  // 日语翻译
    ko?: string | null;  // 韩语翻译
    fr?: string | null;  // 法语翻译
    de?: string | null;  // 德语翻译
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