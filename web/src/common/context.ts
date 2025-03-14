import { createContext } from "react";

export const UserContext = createContext(null);

export const HeaderContext = createContext(null);

// 创建全局Context
export const GlobalContext = createContext({});