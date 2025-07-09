// 导出核心模块 兼容前端

// 导出基础数据类
export { Data, DataList } from "./base/data.mjs"; 



// 导出应用相关数据实例
export {
    AppSetting,
    LocalSetting,
    ENV_CONFIG,
    TEMP_FILE
} from "./instances/appInstances.mjs";

// 导出聊天相关数据实例
export {
    ChatHistory,
    Agents,
    VarList,
    VarScopeList
} from "./instances/chatInstances.mjs";

// // 导出AI相关数据实例
// export {
//     AI_MODELS,
//     AIModelConfig,
//     PROVIDER_CONFIGS
// } from "./instances/aiInstances.mjs";

// 导出MCP相关数据实例
export {
    MCP_CONFIG,
    MCP_GateWay
} from "./instances/mcpInstances.mjs";

// 导出任务相关数据实例
export {
    KNOWLEDGE_BASE,
    TaskList
} from "./instances/taskInstances.mjs";