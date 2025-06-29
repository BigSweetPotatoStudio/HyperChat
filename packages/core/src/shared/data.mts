
import OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { v4 } from "uuid";




// 全局数据实例列表，所有 Data 实例会自动加入此数组
export const DataList: Data<any>[] = [];

/**
 * 通用数据管理类，支持异步/同步初始化与保存，可自定义格式化方法
 * @template T 数据类型
 */
export class Data<T> {
  // 尽量使用异步初始化数据
  async init(): Promise<T> {
    return this._init();
  }
  // 尽量使用异步保存数据
  async save() {
    return this._save();
  }
  private async _init(): Promise<T> {
    throw new Error("Method not implemented.");
  }
  private async _save() {
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
  webdav: { // 废弃⚠️ => electronData
    url: "",
    username: "",
    password: "",
    baseDirName: "",
    // autoSync: false, // 废弃⚠️ => electronData
  },
  darkTheme: false,
  mcpCallToolTimeout: 60,
  defaultAllowMCPs: undefined as string[] | undefined,
  quicks: [] as Array<{  // 废弃⚠️
    value: string;
    label: string;
    quick: string;
  }>,
});

// Electron 相关数据，包含端口、密码、版本、窗口大小等
export const electronData = new Data(
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
  index: number;
  id: string;
  type: "function";
  origin_name?: string;
  restore_name?: string;
  function: {
    name: string;
    arguments: string;
    args: any;
  };
};

// 消息类型扩展，支持多种内容状态、附件、推理内容等
export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  id?: string,
  content_status?:
  | "loading"
  | "success"
  | "error"
  | "dataLoading"
  | "dataLoadComplete";
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
  tool_call_id?: string;
};

// 聊天历史项类型，包含消息、模型、代理、任务等信息
export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<MyMessage>;
  modelKey: string;
  agentKey: string;
  sended: boolean;
  icon?: string;
  requestType: "complete" | "stream";
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

export type AgentData = {
  type?: "builtin" | "custom";
  key: string;
  label: string;
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

export const Agents = new Data("gpts_list.json", {
  data: [] as Array<AgentData>,
});

export type GPT_MODELS_TYPE = {
  key: string;
  name: string;
  model: string;
  apiKey: string;
  baseURL: string;
  provider: string;
  supportImage: boolean;
  supportTool: boolean;
  call_tool_step?: number;
  type?: "llm" | "embedding";
  toolMode?: "standard" | "compatible";
  isStrict: boolean;
  isDefault?: boolean;
}

export class AIModelConfig<T> extends Data<T> {
}
export const GPT_MODELS = new AIModelConfig("gpt_models.json", {
  data: [] as Array<GPT_MODELS_TYPE>,
});


export type MCP_CONFIG_TYPE = {
  command?: string;
  args?: string[];
  env?: { [s: string]: string };
  headers?: { [s: string]: string };
  url?: string;
  type?: "stdio" | "sse" | "streamableHttp";
  hyperchat?: {
    config: { [s in string]: any };
    url: string;  // 废弃⚠️
    type: "stdio" | "sse";  // 废弃⚠️
    scope: "built-in" | "outer";  // 废弃⚠️
  };
  disabled?: boolean;
  isSync?: boolean;
};

export type HyperChatCompletionTool = MCPTypes.Tool & {
  client_name: string;
  origin_name: string; // ! 废弃⚠️
  restore_name: string; // ! 废弃⚠️
  clientName?: string; // ! 废弃⚠️
  client?: string; // ! 废弃⚠️
  function: {
    name: string;
    description: string;
    parameters: string; // JSON string
  }
};
export type IMCPClient = {
  tools: Array<HyperChatCompletionTool>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: "disconnected" | "connected" | "connecting" | "disabled";
  order: number;
  config: MCP_CONFIG_TYPE;
  ext: {
    configSchema?: { [s in string]: any };
  };
  source: "hyperchat" | "claude" | "builtin";
  version: string;
  servername: string;
};

class MCP_CONFIG_DATA<T> extends Data<T> {
  override async save(sync = true): Promise<void> {
    if (sync) {
      let result: any = this.get();
      MCP_CONFIG_SYNC.set(result);
      await MCP_CONFIG_SYNC.save();
    }
    return super.save();
  }
}

export const MCP_CONFIG = new MCP_CONFIG_DATA(
  "mcp.json",
  {
    mcpServers: {} as { [s: string]: MCP_CONFIG_TYPE },
  },
  {
    sync: false,
  }
);

export const MCP_CONFIG_SYNC = new Data(
  "mcp_sync.json",
  {
    mcpServers: {} as { [s: string]: MCP_CONFIG_TYPE },
  },
  {
    sync: true,
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

export type KNOWLEDGE_Store = {
  localPath: string;
  key: string;
  resources: KNOWLEDGE_Resource[];
  name: string;
  model: string;
  description: string;
};

export type KNOWLEDGE_Resource = {
  key: string;
  name: string;
  type: "file" | "text";
  fragments?: KNOWLEDGE_Resource_Fragment[];
  filepath?: string;
  text?: string;
  uniqueId: string;
  entriesAdded: number;
  loaderType: string;
};

export type KNOWLEDGE_Resource_Fragment = {
  resourceKey: string;
  date: number;
  text: string;
  vector: number[];
};

export const KNOWLEDGE_BASE = new Data(
  "knowledge_base.json",
  {
    dbList: [] as Array<KNOWLEDGE_Store>,
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