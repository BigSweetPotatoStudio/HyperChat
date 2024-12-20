import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Link, useNavigate } from "react-router-dom";

import {
  Button,
  Table,
  Switch,
  Modal,
  message,
  Radio,
  Input,
  Tabs,
  ConfigProvider,
  Popconfirm,
  Popover,
  Dropdown,
  Space,
  MenuProps,
  Select,
  Spin,
  Progress,
  App as AntdApp,
} from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

import {
  ChromeFilled,
  CrownFilled,
  DownOutlined,
  ExclamationCircleFilled,
  GithubFilled,
  InfoCircleFilled,
  LoadingOutlined,
  LogoutOutlined,
  QuestionCircleFilled,
  SmileFilled,
  SmileOutlined,
  TabletFilled,
} from "@ant-design/icons";

import { HeaderContext } from "./common/context";
import { PageContainer, ProCard, ProLayout } from "@ant-design/pro-components";
import { getRoute, route } from "./router";

export default function App() {
  return (
    <div>
      <AntdApp>
        <Routes>{getRoute(route)}</Routes>
      </AntdApp>
    </div>
  );
}

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
