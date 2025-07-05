import React from "react";
import { CommentOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { Route } from "react-router-dom";

import { Layout } from "./layout";
import { Setting } from "./pages/setting";
import { Market } from "./pages/market/market";
import { HpyerTools } from "./pages/hypertools/hypertools";
import { KnowledgeBase } from "./pages/knowledgeBase/knowledgeBase";
import { ChatSpace } from "./pages/workspace/chatspace";
import { TaskListPage } from "./pages/hyperAgent/TaskList";
import { t } from "./i18n";
import { TaskResultsPage } from "./pages/hyperAgent/TaskResults";
import { WebdavSetting } from "./pages/setting/sync";
import { Icon } from "./components/icon";
import { VariableList } from "./pages/variableList/variableList";
import { ToolboxPage } from "./pages/Toolbox/Toolbox";
import { Workspace } from "./pages/workspace/workspace";

type RouteType = {
  path: string;
  name: React.ReactNode;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
  component: JSX.Element;
  routes?: Array<RouteType>;
};

// 简化的路由结构，移除复杂的嵌套和注释代码
export function getLayoutRoute() {
  let route: RouteType = {
    path: "/",
    name: "",
    component: <Layout />,
    routes: [
      {
        path: "/home",
        name: t`Home`,
        hideInMenu: true,
        component: <ChatSpace />,
      },
      {
        path: "/Chat",
        name: t`Chat`,
        icon: <CommentOutlined />,
        component: <ChatSpace />,
      },
      {
        path: "/Workspace",
        name: t`Workspace`,
        icon: <FolderOpenOutlined />,
        component: <Workspace />,
      },
      {
        path: "/Market",
        name: t`MCP Extensions`,
        icon: <Icon name="mcp"></Icon>,
        component: <Market />,
      },
      {
        path: "/KnowledgeBase",
        name: t`Knowledge Base(Exp)`,
        icon: <Icon name="knowledgebase"></Icon>,
        component: <KnowledgeBase />,
      },
      {
        path: "/Task",
        name: t`TaskList`,
        icon: <Icon name="task"></Icon>,
        component: <TaskListPage />,
      },
      {
        path: "/Task/Results",
        name: t`TaskResults`,
        hideInMenu: true,
        component: <TaskResultsPage />,
      },
      {
        path: "/Setting",
        name: t`Settings`,
        icon: <Icon name="system-copy" />,
        component: <Setting />,
      },
      {
        path: "/Setting/WebdavSetting",
        name: t`WebdavSetting`,
        hideInMenu: true,
        component: <WebdavSetting />,
      },
      {
        path: "/Setting/HyperTools",
        name: t`HyperTools`,
        hideInMenu: true,
        component: <HpyerTools />,
      },
      {
        path: "/Setting/VariableList",
        name: t`VariableList`,
        hideInMenu: true,
        component: <VariableList />,
      },
      {
        path: "/Toolbox",
        name: t`Toolbox`,
        icon: <Icon name="tools-hardware" />,
        component: <ToolboxPage />,
      }
    ]
  };

  // 简化的路径处理，移除复杂的嵌套逻辑
  function run(route, prefix) {
    if (Array.isArray(route.routes)) {
      for (let r of route.routes) {
        run(r, prefix + r.path);
      }
    }
    route.path = prefix == "" ? "/" : prefix;
    route.component = route.component.wait
      ? route.component.wait(route)
      : route.component;
    return route;
  }
  route = run(route, "");
  return route;
}

export function getRoute(route: RouteType) {
  function run(route) {
    return (
      <Route key={route.path} path={route.path} element={route.component}>
        {route.routes &&
          route.routes.map((r) => {
            return run(r);
          })}
        <Route path="*" element={<div>404</div>} />
      </Route>
    );
  }
  let res = run(route);
  return res;
}
