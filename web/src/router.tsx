import React, { useEffect, useState } from "react";
import { CloudSyncOutlined, CommentOutlined, FolderOpenOutlined, SmileFilled } from "@ant-design/icons";
import {
  Outlet,
  Link,
  useNavigate,
  Route,
  useLocation,
} from "react-router-dom";

import { Layout } from "./layout";
import { Setting } from "./pages/setting";
import { Chat } from "./pages/chat";
import { Market } from "./pages/market/market";
import { HpyerTools } from "./pages/hypertools/hypertools";
import { KnowledgeBase } from "./pages/knowledgeBase/knowledgeBase";
import { ChatSpace } from "./pages/workspace/chatspace";
import { TaskListPage } from "./pages/hyperAgent/TaskList";
import { t } from "./i18n";
import { TaskResultsPage } from "./pages/hyperAgent/TaskResults";
import { WebdavSetting } from "./pages/setting/sync";
import { TerminalPage } from "./pages/setting/terminal";
import { Icon } from "./components/icon";
import { TestPage } from "./pages/TestPage";
import { VariableList } from "./pages/variableList/variableList";
import { AgentPage } from "./pages/Agent";
import { AgentCreatePage } from "./pages/Agent/create";
import { Workspace } from "./pages/workspace/workspace";
import { ToolboxPage } from "./pages/Toolbox/Toolbox";

type RouteType = {
  path: string;
  name: React.ReactNode;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
  component: JSX.Element;
  routes?: Array<RouteType>;
};

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
      // process.env.myEnv == "dev" && {
      //   path: "/Workspace",
      //   name: t`Workspace`,
      //   icon: <FolderOpenOutlined />,
      //   component: <Workspace />,
      // },
      // process.env.myEnv == "dev" && {
      //   path: "/Agent",
      //   name: t`Agent`,
      //   icon: <Icon name="bx-bot" />,
      //   component: <Container from="/Agent" default="./List" />,
      //   routes: [
      //     {
      //       path: "/List",
      //       name: t`Agent`,
      //       component: <AgentPage />,
      //       hideInMenu: true,
      //     },
      //     {
      //       path: "/Create",
      //       name: t`Create`,
      //       component: <AgentCreatePage />,
      //       hideInMenu: true,
      //     },
      //   ],
      // },

      // {
      //   path: "/Agent",
      //   name: "Agent",
      //   icon: <Icon name="bx-bot" />,
      //   component: <AgentPage />,
      // },
      // {
      //   path: "/Agent/Create",
      //   name: "AgentCreate",
      //   icon: <Icon name="bx-bot" />,
      //   component: <AgentCreatePage />,
      //   hideInMenu: true,
      // },
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
        component: <Container from="/Task" default="list" />,
        routes: [
          {
            path: "/list",
            name: t`TaskList`,
            component: <TaskListPage />,
            hideInMenu: true,
          },
          {
            path: "/Results",
            name: t`TaskResults`,
            component: <TaskResultsPage />,
            hideInMenu: true,
          },
        ],
      },
      {
        path: "/Setting",
        name: t`Settings`,
        icon: <Icon name="system-copy" />,
        component: <Container from="/Setting" default="Setting" />,
        routes: [
          {
            path: "/Setting",
            name: t`Settings`,
            icon: <Icon name="resources" />,
            component: <Setting />,
          },
          {
            path: "/WebdavSetting",
            name: t`WebdavSetting`,
            icon: <CloudSyncOutlined />,
            component: <WebdavSetting />,
          },
          {
            path: "/HyperTools",
            name: t`HyperTools`,
            icon: <Icon name="tool" />,
            component: <HpyerTools />,
          },

          {
            path: "/VariableList",
            name: t`VariableList`,
            icon: <Icon name="var"></Icon>,
            component: <VariableList />,
          }

          // {
          //   path: "/Terminal",
          //   name: t`Terminal`,
          //   icon: "⌨️",
          //   component: <TerminalPage />,
          // }

        ],
      },

      {
        path: "/ToolboxPage",
        name: t`ToolboxPage`,
        icon: "⌨️",
        component: <ToolboxPage />,
      }
    ].filter(x => x)
  };

  function Container(props: { from: string; default?: string }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (props.default && location.pathname == props.from) {
        setTimeout(() => {
          navigate(props.default);
        }, 0);
      }
    }, [props.default, location.pathname]);
    return (
      <div className="my-container h-full">
        <Outlet />
      </div>
    );
  }

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
  // console.log(route);
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
