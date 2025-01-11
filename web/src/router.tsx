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

type RouteType = {
  path: string;
  name: React.ReactNode;
  hideInMenu?: boolean;
  icon?: React.ReactNode;
  component: JSX.Element | { wait: (props) => JSX.Element };
  routes?: Array<RouteType>;
};

let route: RouteType = {
  path: "/",
  name: "",
  component: <Layout />,
  routes: [
    {
      path: "/home",
      name: "Home",
      hideInMenu: true,
      component: <Chat />,
    },
    {
      path: "/Chat",
      name: "Chat",
      icon: "💬",
      component: <Chat />,
    },
    {
      path: "/Market",
      name: "MCP Extensions",
      icon: "💻",
      component: <Market />,
    },
    {
      path: "/KnowledgeBase",
      name: "Knowledge Base(Experimental)",
      icon: "📚",
      component: <KnowledgeBase />,
    },
    {
      path: "/HpyerTools",
      name: "HpyerTools",
      icon: "🔧",
      component: <HpyerTools />,
    },
    {
      path: "/Setting",
      name: "Settings",
      icon: "⚙️",
      component: <Setting />,
    },
  ],
};

function Container(props: { from: string; default: string }) {
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
console.log(route);
export { route };
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
