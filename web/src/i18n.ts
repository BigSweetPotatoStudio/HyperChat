import React from "react";

import json from "./i18n.json";
import { call } from "./common/call";
const i18nText = {};
Object.assign(i18nText, json);
let currLang = navigator.language == "zh-CN" ? "zhCN" : "enUS";

if (localStorage.getItem("currLang")) {
  currLang = localStorage.getItem("currLang");
}
if (process.env.NODE_ENV == "development") {
  window.localStorage.setItem("i18nText", JSON.stringify(i18nText, null, 4));
}

// currLang = "enUS";
console.log("currLang: ", currLang);
const setCurrLang = (lang) => {
  currLang = lang;
  localStorage.setItem("currLang", lang);
};
window.translate = function (child) {
  if (i18nText[child] == null) {
    if (process.env.NODE_ENV == "development" && hasEnglish(child)) {
      i18nText[child] = {
        en: child,
        zh: null,
      };
      window.localStorage.setItem(
        "i18nText",
        JSON.stringify(i18nText, null, 4),
      );
    }
    return child;
  } else {
    if (currLang == "zhCN") {
      return i18nText[child].zh || child;
    } else {
      return child;
    }
  }
};
function hasEnglish(str: string): boolean {
  return /[a-zA-Z]/.test(str);
}
function hasChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str);
}
export { currLang, setCurrLang };
