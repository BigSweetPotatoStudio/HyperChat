import React from "react";
import { FolderOpenOutlined } from "@ant-design/icons";
import { Route } from "react-router-dom";

import { Layout } from "./layout";
import { t } from "./i18n";
import { Workspace } from "./pages/workspace/workspace";

type RouteType = {
  path: string;
  name: React.ReactNode;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
  component: JSX.Element;
  routes?: Array<RouteType>;
};

// 简化的路由结构，只保留Workspace路由
export function getLayoutRoute() {
  let route: RouteType = {
    path: "/",
    name: "",
    component: <Layout />,
    routes: [
      {
        path: "/Workspace",
        name: t`Workspace`,
        icon: <FolderOpenOutlined />,
        component: <Workspace />,
      }
    ]
  };

  // 简化的路径处理
  function run(route: RouteType, prefix: string): RouteType {
    if (Array.isArray(route.routes)) {
      for (let r of route.routes) {
        run(r, prefix + r.path);
      }
    }
    route.path = prefix == "" ? "/" : prefix;
    route.component = (route.component as any).wait
      ? (route.component as any).wait(route)
      : route.component;
    return route;
  }
  route = run(route, "");
  return route;
}

export function getRoute(route: RouteType) {
  function run(route: RouteType): React.ReactElement {
    return (
      <Route key={route.path} path={route.path} element={route.component}>
        {route.routes &&
          route.routes.map((r: RouteType) => {
            return run(r);
          })}
        <Route path="*" element={<div>404</div>} />
      </Route>
    );
  }
  let res = run(route);
  return res;
}
