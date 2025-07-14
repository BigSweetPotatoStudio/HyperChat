/**
 * HyperChat 国际化（i18n）模块
 * 
 * 功能：
 * 1. 支持中文（zhCN）和英文（enUS）两种语言
 * 2. 自动检测浏览器语言偏好
 * 3. 支持模板字符串翻译语法：t`Hello ${name}!`
 * 4. 开发模式下自动收集需要翻译的文本
 * 5. 持久化存储用户语言偏好
 * 
 * 使用示例：
 * import { t, setCurrLang } from './i18n';
 * 
 * // 基础翻译
 * const text = t`Welcome to HyperChat`;
 * 
 * // 带变量的翻译
 * const greeting = t`Hello ${userName}!`;
 * 
 * // 切换语言
 * setCurrLang('zhCN');
 */

import React from "react";

// 导入翻译数据文件
import json from "./i18n.json";
import { call } from "./common/call";

// 存储所有翻译文本的对象
const i18nText = {};
Object.assign(i18nText, json);

// 根据浏览器语言自动设置当前语言，默认中文环境使用中文，其他使用英文
let currLang = navigator.language == "zh-CN" ? "zhCN" : "enUS";

// 从本地存储中获取用户之前设置的语言偏好
if (localStorage.getItem("currLang")) {
  currLang = localStorage.getItem("currLang") || currLang;
}

// 开发模式下，将翻译数据存储到 localStorage 中，方便调试
if (process.env.NODE_ENV == "development") {
  window.localStorage.setItem("i18nText", JSON.stringify(i18nText, null, 2));
}

/**
 * 国际化翻译函数 - 支持模板字符串语法
 * 使用方式：t`Hello ${name}!` 或 t`Welcome to HyperChat`
 * @param strings 模板字符串的静态部分数组
 * @param values 插值的动态部分数组
 * @returns 翻译后的文本
 */
export function t(strings: TemplateStringsArray, ...values: any[]): string {
  // strings: 模板字符串的静态部分
  // values: 插值的动态部分
  
  // 将模板字符串重新组合成完整字符串
  let str = strings.reduce(
    (result: string, str: string, i: number) => result + str + (values[i] || ""),
    "",
  );
  
  // console.log("str: ", i18nText, str);
  
  // 如果翻译数据中没有这个文本
  if ((i18nText as any)[str] == null) {
    // 开发模式下，如果文本包含英文字符，自动添加到翻译数据中
    if (process.env.NODE_ENV == "development" && hasEnglish(str)) {
      (i18nText as any)[str] = {
        en: str,     // 英文原文
        zh: null,    // 中文翻译（待填充）
      };
      // 更新本地存储中的翻译数据
      window.localStorage.setItem(
        "i18nText",
        JSON.stringify(i18nText, null, 2),
      );
    }
    // 返回原文本
    return str;
  } else {
    // 根据当前语言返回对应翻译
    if (currLang == "zhCN") {
      return (i18nText as any)[str].zh || str;  // 返回中文翻译，如果没有则返回原文
    } else {
      return str;  // 英文环境直接返回原文
    }
  }
}

// currLang = "enUS";  // 调试用：强制设置语言为英文
console.log("currLang: ", currLang);

/**
 * 设置当前语言
 * @param lang 语言代码：'zhCN' 或 'enUS'
 */
const setCurrLang = (lang: string) => {
  currLang = lang;
  localStorage.setItem("currLang", lang);
};


/**
 * 检查字符串是否包含英文字符
 * @param str 要检查的字符串
 * @returns 是否包含英文字符
 */
function hasEnglish(str: string): boolean {
  return /[a-zA-Z]/.test(str);
}

// 注释掉的中文检测函数（保留用于将来可能的需求）
// function hasChinese(str) {
//   return /[\u4e00-\u9fa5]/.test(str);
// }

// 导出当前语言和语言设置函数
export { currLang, setCurrLang };
