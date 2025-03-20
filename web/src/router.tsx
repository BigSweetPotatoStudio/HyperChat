import React, { useEffect, useState } from "react";
import { SmileFilled } from "@ant-design/icons";
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
import { WorkSpace } from "./pages/workspace";
import { TaskListPage } from "./pages/hyperAgent/TaskList";
import { t } from "./i18n";
import { TaskResultsPage } from "./pages/hyperAgent/TaskResults";
type RouteType = {
  path: string;
  name: React.ReactNode;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
  component: JSX.Element | { wait: (props) => JSX.Element };
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
        component: <Chat />,
      },
      {
        path: "/Chat",
        name: t`Chat`,
        icon: "💬",
        component: <WorkSpace />,
      },
      // {
      //   path: "/WorkSpace",
      //   name: "WorkSpace",
      //   icon: "💬",
      //   component: <WorkSpace />,
      // },
      {
        path: "/Market",
        name: t`MCP Extensions`,
        icon: "💻",
        component: <Market />,
      },
      {
        path: "/KnowledgeBase",
        name: t`Knowledge Base(Exp)`,
        icon: "📚",
        component: <KnowledgeBase />,
      },
      {
        path: "/HyperTools",
        name: t`HyperTools`,
        icon: "🛠️",
        component: <HpyerTools />,
      },
      {
        path: "/Task",
        name: t`TaskList`,
        icon: "📅",
        component: <Container from="/Task" default="List" />,
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
        icon: "⚙️",
        component: <Setting />,
      },
    ],
  };
  
  function Container(props: { from: string; default?: string }) {
    const navigate = useNavigate();
    const location = useLocation();
    // console.log("location.pathname", location.pathname);
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
