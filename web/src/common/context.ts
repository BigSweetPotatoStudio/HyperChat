import { createContext } from "react";
import { InitedClient } from "./mcp";

export const UserContext = createContext(null);

export const HeaderContext = createContext<{
    mcpClients: InitedClient[],
    globalState: number,
    setLang: (lang: string) => void,
    updateGlobalState: (num) => void
}>(null);

// 创建全局Context
export const GlobalContext = createContext({});