console.log("HyperChat");
console.log("process.env.myEnv", process.env.myEnv);
document.documentElement.setAttribute('data-color-mode', 'light');
import "../public/iconfont.js"
import "./i18n";
import "./common/call";
import "./common/data";
import React from "react";
import ReactDOM from "react-dom/client";

import { HashRouter } from "react-router-dom";
import App from "./App";
import { call } from "./common/call";
import { config } from "./common/config";
import "./tailwind.css";
import { ConfigProvider } from "antd";
import { StyleProvider, px2remTransformer } from "@ant-design/cssinjs";

// Web 前端入口文件，负责全局样式、国际化、主题、根组件挂载等
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
  auto as followSystemColorScheme,
  exportGeneratedCSS as collectCSS,
  isEnabled as isDarkReaderEnabled,
} from "darkreader";
import { AppSetting } from "../../common/data.mjs";

// 初始化应用设置，自动切换暗色主题
(async () => {
  await AppSetting.init();
  if (AppSetting.get().darkTheme) {
    enableDarkMode({
      brightness: 100,
      contrast: 90,
      sepia: 10,
    });
  }
})(); // 获取是否自动启动

// 设置 vh 单位 CSS 变量，适配移动端
function setVhCssVar() {
  const vh = window.innerHeight * 0.01;
  // 创建全局变量 --vh
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setVhCssVar();
window.addEventListener("resize", setVhCssVar);

console.log("start");
const px2rem = px2remTransformer({
  rootValue: 16, // 32px = 1rem; @default 16
});

// 挂载 React 根组件
if (document.getElementById("root")) {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    // <React.StrictMode>
    <ConfigProvider theme={{
      components: {
        Table: {
          /* 这里是你的组件 token */
        },
      },
    }}>
      <StyleProvider transformers={[px2rem]}>
        <HashRouter>
          <App />
        </HashRouter>
      </StyleProvider>
    </ConfigProvider>,
    // </React.StrictMode>
  );
}
