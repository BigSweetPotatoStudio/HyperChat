import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Link, useNavigate } from "react-router-dom";
// 引入 Ant Design 相关组件和图标
import {
  Button, // 按钮组件，常用于表单、操作按钮
  Table, // 表格组件，展示结构化数据
  Switch, // 开关组件，布尔值切换
  Modal, // 模态框组件，弹窗交互
  message, // 全局提示信息
  Radio, // 单选框组件
  Input, // 输入框组件
  Tabs, // 标签页组件
  ConfigProvider, // 全局配置提供者，设置主题、语言等
  Popconfirm, // 气泡确认框
  Popover, // 气泡卡片
  Dropdown, // 下拉菜单
  Space, // 间距组件
  MenuProps, // 菜单属性类型
  Select, // 下拉选择器
  Spin, // 加载中指示器
  Progress, // 进度条
  App as AntdApp, // Antd 应用级容器
} from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import {
  ChromeFilled, // 图标：Chrome
  CrownFilled, // 图标：皇冠
  DownOutlined, // 图标：下箭头
  ExclamationCircleFilled, // 图标：感叹号
  GithubFilled, // 图标：GitHub
  InfoCircleFilled, // 图标：信息
  LoadingOutlined, // 图标：加载中
  LogoutOutlined, // 图标：退出
  QuestionCircleFilled, // 图标：问号
  SmileFilled, // 图标：笑脸
  SmileOutlined, // 图标：空心笑脸
  TabletFilled, // 图标：平板
} from "@ant-design/icons";
import { HeaderContext } from "./common/context";
import { PageContainer, ProCard, ProLayout } from "@ant-design/pro-components";
import { getRoute, getLayoutRoute } from "./router";
import { electronData, DataList } from "@hyperchat/shared/data.mjs";
import { call } from "./common/call";
import { EVENT } from "./common/event";

/**
 * App 组件为 Web 前端的主入口：
 * - 初始化全局数据（如 electronData）
 * - 自动同步 WebDAV 数据（如开启 autoSync）
 * - 提供全局 loading 状态
 * - 渲染主路由结构和全局 Spin 加载指示
 */
export default function App() {
  const [loading, setLoading] = useState(false); // 控制全局加载状态
  useEffect(() => {
    (async () => {
      // 初始化 electronData，自动同步 WebDAV 数据
      let st = await electronData.init();
      if (st.autoSync) {
        setLoading(true);
        try {
          // 触发 WebDAV 同步
          await call("webDavSync");
          setLoading(false);
        } catch (e) {
          setLoading(false);
          console.error(e); // 同步失败时输出错误
        }
      }
    })();
  }, []);

  return (
    <div>
      {/* 全局 Spin 组件，loading 时显示同步提示 */}
      <Spin
        spinning={process.env.NODE_ENV === "production" && loading}
        tip="Syncing..."
      >
        {/* AntdApp 提供全局样式和上下文，Routes 渲染所有页面路由 */}
        <AntdApp>
          <Routes>{getRoute(getLayoutRoute())}</Routes>
        </AntdApp>
      </Spin>
    </div>
  );
}

/**
 * NoMatch 组件：用于未匹配到路由时的兜底页面
 */
function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
