
import OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { v4 } from "uuid";
import { ProviderManager } from "./providers.mjs";





// 全局数据实例列表，所有 Data 实例会自动加入此数组
export const DataList: Data<any>[] = [];

/**
 * 通用数据管理类，支持异步/同步初始化与保存，可自定义格式化方法
 * @template T 数据类型
 */
export class Data<T> {
  private inited = false;
  // 尽量使用异步初始化数据
  async init(): Promise<T> {
    this.inited = true;
    return this._init();
  }
  // 尽量使用异步保存数据
  async save() {
    if (!this.inited) {
      await this.init();
    }
    return this._save();
  }
  async _init(): Promise<T> { // 内部使用
    throw new Error("Method not implemented.");
  }
  async _save() { // 内部使用
    throw new Error("Method not implemented.");
  }

  /**
   * 构造函数
   * @param KEY 数据唯一标识（文件名）
   * @param data 初始数据
   * @param options 配置项
   */
  constructor(
    public KEY: string,
    private data: T,
    public options: {
      sync?: boolean;
      formatInit?: (x: T) => T;
      formatSave?: (x: T) => T;
    } = {
        sync: true,
      }
  ) {
    // 默认 sync 为 true
    this.options.sync = this.options.sync != null ? this.options.sync : true;
    // 初始化格式化函数
    this.options.formatInit = this.options.formatInit || ((x) => x);
    this.options.formatSave = this.options.formatSave || ((x) => x);
    // 自动注册到 DataList
    DataList.push(this);
  }
  // 获取数据（需先加载init）
  get(): T {
    return this.data;
  }
  // 设置数据 (需要保存save)
  set(data: T) {
    this.data = data;
  }

  /**
   * 动态重写 init/save 方法
   */
  public override({ init, save }: { init: () => Promise<T>; save: () => Promise<void>; }) {
    (this._init = init);
    (this._save = save);
  }
}

// 应用设置数据，包含主题、WebDAV、MCP超时等
export const AppSetting = new Data("app_setting.json", {
  isAutoLauncher: false,
  // webdav: { // 废弃⚠️ => electronData
  //   url: "",
  //   username: "",
  //   password: "",
  //   baseDirName: "",
  //   // autoSync: false, // 废弃⚠️ => electronData
  // },
  darkTheme: false,
  mcpCallToolTimeout: 60,
  defaultAllowMCPs: undefined as string[] | undefined,
  // quicks: [] as Array<{  // 废弃⚠️
  //   value: string;
  //   label: string;
  //   quick: string;
  // }>,
});

// Electron 相关数据，包含端口、密码、版本、窗口大小等
export const LocalSetting = new Data(
  "electronData.json",
  {
    // port: 0,
    password: "123456",
    // mcp_server_port: 0,
    version: "",
    appDataDir: "",
    logFilePath: "",
    PATH: "",
    platform: "",
    firstOpen: true,
    downloaded: {} as {
      [s: string]: boolean;
    },
    updated: {} as {
      [s: string]: boolean;
    },
    autoSync: false,
    webdav: {
      url: "",
      username: "",
      password: "",
      baseDirName: "",
    },
    uuid: v4(),
    runTask: false,
    isDeveloper: false,
    isLoadClaudeConfig: true,
    lastSyncTime: 0,
    windowSize: {
      width: 1440,
      height: 900,
    },
    browserNetworkSetting: "server-proxy",
    closeAction: undefined as "minimize" | "exit" | undefined,
  },
  {
    sync: false,
  }
);

// 工具调用类型定义
export type Tool_Call = {
  origin_name: string;  // 废弃
  restore_name: string; // 废弃
  index: number;
  id: string;
  type: "function";
  function: {
    name: string;
    args: any;
  };
};

type CommonContent =  Array<{ text: string; type: "text" } | { type: "image_url", image_url: { url: string } }>;

type UserMessage = {
  role: "user";
  content: string | CommonContent;
};

type SystemMessage = {
  role: "system";
  content: string | CommonContent;
};

type AssistantMessage = {
  role: "assistant";
  content: string | CommonContent;
}

type ToolMessage = {
  role: "tool";
  content: string | CommonContent;
  tool_calls?: Tool_Call[];
};

type AllMessage = UserMessage | SystemMessage | AssistantMessage | ToolMessage;
// 消息类型扩展，支持多种内容状态、附件、推理内容等
export type MyMessage = AllMessage & {
  content_status?:
  | "loading" // request is loading
  | "success" // request is success
  | "error" // request is error
  | "dataLoading" // stream data is loading
  | "dataLoadComplete"; // stream is load complete
  content_sended?: boolean;
  content_template?: string;
  content_error?: string;
  content_from?: string;
  content_attachment?: Array<{
    type: string;
    text?: string;
    mimeType?: string;
    data?: string;
  }>;
  reasoning_content?: string;
  content_tool_calls?: Tool_Call[]; // openai tool call
  content_context?: any;
  content_attached?: boolean;
  content_date?: number;
  content_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_call_id?: string; // 工具调用的 ID
  tool_call_name?: string; // 工具调用的名称 // 谷歌需要
};

// 聊天历史项类型，包含消息、模型、代理、任务等信息
export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<MyMessage>;
  modelKey: string;
  agentKey: string;
  sented: boolean;
  icon?: string;
  requestType: "stream";  // 以后只支持 stream
  dateTime: number;
  isCalled: boolean;
  isTask: boolean;
  taskKey?: string;
  allowMCPs: string[];
  attachedDialogueCount?: number;
  temperature?: number;
  deleted?: boolean;
  confirm_call_tool: boolean;
  lastMessage?: MyMessage;
  version?: number | string;
};

export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<ChatHistoryItem>,
}, {
  sync: true,
});

export type Agent = {
  type?: "builtin" | "custom";
  key: string;
  name: string;
  prompt: string;
  description?: string;
  callable?: boolean;
  allowMCPs: string[];
  modelKey?: string;
  attachedDialogueCount?: number;
  temperature?: number;
  confirm_call_tool: boolean;
  fallbackModelKey?: string;
  tags?: string[];
  subAgents?: string[];
  version?: number
}


export const Agents = new Data("agents.json", {
  data: [] as Array<Agent>,
});

export type AIModelConfigItem = {
  key: string;
  name: string;
  model: string;
  apiKey: string; // 废弃 get from provider
  baseURL: string; // 废弃 get from provider
  provider: KnownProvider | string;
  supportImage: boolean;
  supportTool: boolean;
  call_tool_step?: number;
  type?: "llm" | "embedding";
  toolMode?: "standard" | "compatible";
  // isStrict: boolean; // 废弃⚠️
  isDefault?: boolean;
}

export class AIModelConfig<T = { data: Array<AIModelConfigItem> }> extends Data<T> {
  providerConfigs: any;
  override async init(): Promise<T> {
    let res: { data: Array<AIModelConfigItem> } = await this._init() as any;
    let providerConfigs = await PROVIDER_CONFIGS.init();
    this.providerConfigs = providerConfigs;
    for (let item of res.data) {
      if (item.provider === "gemini-openai") {
        item.provider = "gemini"; // 兼容旧数据
      }
      if (item.provider === "anthropic-openai") {
        item.provider = "anthropic"; // 兼容旧数据
      }
      let provider = providerConfigs.builtinApiKeys[item.provider as KnownProvider] || providerConfigs.customProviders.find(p => p.key === item.provider);
      item.apiKey = provider?.apiKey || '';
      item.baseURL = provider?.baseURL || '';
    }
    return res as any;
  }
  getGroupedByProvider(): { label: string, value: string, options: Array<{ label: string, value: string }> }[] {
    // let providerConfigs = await PROVIDER_CONFIGS.init();
    const modelData = (this.get() as { data: Array<AIModelConfigItem> }).data.filter(
      (x) => x.type == "llm" || x.type == null,
    );
    const providers = ProviderManager.getAllProviders();

    return providers.map((provider) => {
      // 找到该供应商下的所有模型
      const providerModels = modelData.filter(model => model.provider === provider.key);

      return {
        label: provider.label,
        value: provider.key,
        options: providerModels.map(model => ({
          label: `${provider.key}:${model.name}`,
          value: model.key,
        })),
      };
    }).filter(group => group.options.length > 0); // 只返回有模型的供应商

  }
}
export const AI_MODELS = new AIModelConfig("ai_models.json", { // ai_models.json
  data: [] as Array<AIModelConfigItem>,
});

export type KnownProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "gemini"
  | "qwen"
  | "deepseek"
  | "doubao"
  | "xai"
  | "glm"
  | "ollama";
// 提供商配置接口，描述每个大模型 API 的基本信息
export interface ProviderConfig {
  key: KnownProvider; // 唯一标识
  label: string; // 显示名称
  baseURL: string; // API 基础地址
  icon?: string; // 图标
  description?: string; // 描述
  hasApiKey?: boolean;
  apiKey?: string; // API Key 字段
  isBuiltIn: boolean; // 是否内置（true=内置，false=自定义）
}
// 提供商管理数据存储，包含自定义、API Key 等
export const PROVIDER_CONFIGS = new Data('provider_configs.json', {
  customProviders: [] as Array<ProviderConfig>,
  builtinApiKeys: {} as { [key: string]: { apiKey: string; baseURL: string } }, // 新增属性
});

export type MCPServerConfig = {
  command?: string;
  args?: string[];
  env?: { [s: string]: string };
  headers?: { [s: string]: string };
  url?: string;
  type?: "stdio" | "sse" | "streamableHttp";
  hyperchat?: {
    config: { [s in string]: any };
    // url: string;  // 废弃⚠️
    // type: "stdio" | "sse";  // 废弃⚠️
    // scope: "built-in" | "outer";  // 废弃⚠️
  };
  disabled?: boolean;
};

export type HyperChatCompletionTool = {
  name: string;
  origin_name: string;
  restore_name: string;
  clientName: string;
  description: string;
  inputSchema: {
    [x: string]: unknown;
    type: "object";
    properties?: {
      [x: string]: unknown;
    } | undefined;
  };
};
export type IMCPClient = {
  tools: Array<HyperChatCompletionTool>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: "disconnected" | "connected" | "connecting" | "disabled" | "deleted";
  order: number;
  config: MCPServerConfig;
  ext: {
    configSchema?: { [s in string]: any };
  };
  source: "hyperchat" | "builtin";
  version: string;
  servername: string;
};


export const MCP_CONFIG = new Data(
  "mcp.json",
  {
    mcpServers: {} as { [s: string]: MCPServerConfig },
  },
  {
    sync: false,
  }
);



export const ENV_CONFIG = new Data(
  "env.json",
  {
    PATH: "",
  },
  {
    sync: false,
  }
);

export const TEMP_FILE = new Data(
  "temp_file.json",
  {
    mcpExtensionDataJS: "",
  },
  {
    sync: false,
  }
);

export type KnowledgeStore = {
  localPath: string;
  key: string;
  resources: KnowledgeResource[];
  name: string;
  model: string;
  description: string;
};

export type KnowledgeResource = {
  key: string;
  name: string;
  type: "file" | "text";
  fragments?: KnowledgeFragment[];
  filepath?: string;
  text?: string;
  uniqueId: string;
  entriesAdded: number;
  loaderType: string;
};

export type KnowledgeFragment = {
  resourceKey: string;
  date: number;
  text: string;
  vector: number[];
};

export const KNOWLEDGE_BASE = new Data(
  "knowledge_base.json",
  {
    dbList: [] as Array<KnowledgeStore>,
  },
  {
    sync: false,
  }
);

export type Task = {
  key: string;
  name: string;
  command: string;
  agentKey: string;
  description: string;
  cron: string;
  disabled: boolean;
  // status: "pending" | "runing" | "error" | "done";
};

export const TaskList = new Data(
  "tasklist.json",
  {
    data: [] as Array<Task>,
  },
  {
    sync: true,
  }
);
export type Var = {
  key: string;
  name: string;
  value?: string;
  scope: string;
  variableStrategy: "lazy" | "immediate";
  variableType: "string" | "js" | "webjs";
  code?: string;
  description?: string;
};

export type VarScope = {
  key: string;
  name: string;
  type: "builtin" | "custom";
};



export const VarList = new Data(
  "var.json",
  {
    data: [{
      "key": "4c80381e-88fa-4010-a5c7-03420bbe7d11",
      "name": "currentTime",
      "variableType": "js",
      "code": "function get(){\n    return new Date().toLocaleString('zh-CN', {\n  year: 'numeric',\n  month: '2-digit',\n  day: '2-digit',\n  hour: '2-digit',\n  minute: '2-digit',\n  second: '2-digit',\n  hour12: false\n});\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current time",
    },
    {
      "key": "4c80381e-88fa-4010-a5c7-03420bbe7d14",
      "name": "currentTimeFromServer",
      "variableType": "webjs",
      "code": "function get(){\n    return new Date().toLocaleString('zh-CN', {\n  year: 'numeric',\n  month: '2-digit',\n  day: '2-digit',\n  hour: '2-digit',\n  minute: '2-digit',\n  second: '2-digit',\n  hour12: false\n});\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current time",
    },
    {
      "key": "e7517b77-14cd-40ed-b25a-1fe0c328be1e",
      "name": "LANG",
      "variableType": "webjs",
      "code": "function get(){\nlet currLang = navigator.language == \"zh-CN\" ? \"zhCN\" : \"enUS\";\nif (localStorage.getItem(\"currLang\")) {\n  currLang = localStorage.getItem(\"currLang\");\n}\nreturn currLang == \"zhCN\" ? \"中文\" : \"English\";\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the current language",
    },
    {
      "key": "6c9f704e-69ab-47b6-b10f-ae9927801ee8",
      "name": "Clipboard",
      "variableType": "webjs",
      "code": "async function get(){\n    return await window.navigator.clipboard.readText();\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the clipboard contents",
    },
    {
      "key": "88970a9a-d328-422a-bedc-617c0caf635c",
      "name": "os",
      "variableType": "js",
      "code": "const os = require('os');\n/**\n * 获取系统名称\n * @returns {string} 系统名称的描述字符串\n */\nfunction get() {\n    const platform = os.platform();\n    let systemDescription = '';\n\n    switch (platform) {\n        case 'win32':\n            systemDescription = 'Windows';\n            break;\n        case 'darwin':\n            systemDescription = 'macOS';\n            break;\n        case 'linux':\n            systemDescription = 'Linux';\n            break;\n        default:\n            systemDescription = 'Unknown system';\n    }\n    return systemDescription;\n}",
      "scope": "var",
      "variableStrategy": "lazy",
      "description": "Get the system name",
    },] as Array<Var>,
  },
  {
    sync: true,
  }
);

export const VarScopeList = new Data(
  "var_scope.json",
  {
    data: [{
      name: "var",
      key: v4(),
      type: "custom",
    }, {
      name: "quick",
      key: v4(),
      type: "custom",
    }] as Array<VarScope>,
  },
  {
    sync: true,
  }
);


export const MCP_GateWay = new Data(
  "mcp_gateway.json",
  {
    data: [] as Array<{
      name: string;
      description?: string;
      allowMCPs: string[];
    }>,
  },
  {
    sync: true,
  }
);


type WorkSpace = {
  path: string;
  mcp: Record<string, IMCPClient>;
  agents: Array<Agent>;
  historys: Array<ChatHistoryItem>;
};