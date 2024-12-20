import React from "react";

import json from "./i18n.json";
import { call } from "./common/call";
const i18nText = {};
Object.assign(i18nText, json);
let currLang = navigator.language == "zh-CN" ? "zhCN" : "enUS";

if (localStorage.getItem("currLang")) {
  currLang = localStorage.getItem("currLang");
}

// currLang = "enUS";
console.log("currLang: ", currLang);
const setCurrLang = (lang) => {
  currLang = lang;
  localStorage.setItem("currLang", lang);
};
window.tranlate = function (child) {
  if (i18nText[child] == null) {
    if (process.env.NODE_ENV == "development" && hasChinese(child)) {
      i18nText[child] = {
        zh: child,
        en: null,
      };
      window.localStorage.setItem(
        "i18nText",
        JSON.stringify(i18nText, null, 4),
      );
    }
    return child;
  } else {
    if (currLang == "enUS") {
      return i18nText[child].en || child;
    } else {
      return child;
    }
  }
};
function hasChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str);
}
export { currLang, setCurrLang };
