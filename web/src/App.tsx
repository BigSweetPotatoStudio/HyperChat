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
import { AppSetting } from "../../common/data";
import { call } from "./common/call";
import { EVENT } from "./common/event";

export default function App() {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      let st = await AppSetting.init();
      if (st.webdav.autoSync) {
        setLoading(true);
        try {
          await call("webDavSync", []);
          EVENT.fire("refresh");
          setLoading(false);
        } catch (e) {
          setLoading(false);
          console.error(e);
        }
      }
    })();
  }, []);

  return (
    <div>
      <Spin spinning={process.env.NODE_ENV === "production" && loading} tip="Syncing...">
        <AntdApp>
          <Routes>{getRoute(route)}</Routes>
        </AntdApp>
      </Spin>
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
