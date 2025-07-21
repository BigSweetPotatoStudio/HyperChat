console.log("HyperChat");
console.log("process.env.myEnv", process.env.myEnv);
document.documentElement.setAttribute('data-color-mode', 'light');



import "../public/iconfont.js"
import "./i18n";
import "./common/call";

import React from "react";
import ReactDOM from "react-dom/client";

import { HashRouter } from "react-router-dom";
import App from "./App";
import { call } from "./common/call";
import { config } from "./common/config";
import "./tailwind.css";
import { ConfigProvider } from "antd";
import { StyleProvider, px2remTransformer } from "@ant-design/cssinjs";

import { initWebI18n } from "./i18n";
await initWebI18n().catch(console.error);

import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

loader.config({ monaco });

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
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");
  const root = ReactDOM.createRoot(rootElement);
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
