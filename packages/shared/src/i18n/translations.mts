/**
 * HyperChat 翻译数据
 * 
 * 从 packages/shared/src/i18n/i18n.json 加载翻译数据
 * 格式：{ "英文原文": { "zh": "中文翻译" } }
 */

import type { TranslationData } from './types.mjs';
import i18nJson from './i18n.json' with { type: 'json' };

export const translations: TranslationData = i18nJson as TranslationData;
