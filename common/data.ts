import type OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { v4 } from "uuid";
import { number, z } from "zod";
export const DataList: Data<any>[] = [];

export class Data<T> {
  private localStorage: any = null;
  private _inited = false;
  async init({ force } = { force: true }) {
    if (!force && this._inited) return this.data;
    this._inited = true;
    let localData = {};
    try {
      this.localStorage = await this.inget().catch(() => "{}");
      if (this.localStorage) {
        localData = JSON.parse(this.localStorage);
      }
    } catch (e) {
      localData = {};
    }
    this.data = Object.assign({}, this.data, localData);
    return this.data;
  }
  initSync({ force } = { force: true }) {
    let localData = {};
    try {
      this.localStorage = this.inget();
      if (this.localStorage) {
        localData = JSON.parse(this.localStorage);
      }
    } catch (e) {
      localData = {};
    }
    this.data = Object.assign({}, this.data, localData);
    return this.data;
  }

  constructor(
    public KEY: string,
    private data: T,
    public options = {
      sync: true,
    }
  ) {
    DataList.push(this);
  }
  get(): T {
    return this.data;
  }
  set(data: T) {
    this.data = data;
  }
  // get d(): T {
  //   return this.data;
  // }
  format(x) {
    return x;
  };
  async save() {
    this.insave();
  }
  private inget(): Promise<T> {
    throw new Error("Method not implemented.");
  }

  private insave(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public override({ inget, insave }) {
    inget && (this.inget = inget);

    insave && (this.insave = insave);
  }
}



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
  },
  {
    sync: false,
  }
);

export type Tool_Call = {
  index: number;
  id: string;
  type: "function";
  origin_name?: string;
  restore_name?: string;
  function: {
    name: string;
    arguments: string;
    argumentsOBJ: any;
  };
};


export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  tool_calls?: Tool_Call[]; // openai tool call
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
  version?: string;
};

export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<ChatHistoryItem>,
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
export const GPT_MODELS = new Data("gpt_models.json", {
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

export type HyperChatCompletionTool = typeof MCPTypes.ToolSchema._type & OpenAI.ChatCompletionTool & {
  origin_name?: string;
  restore_name?: string;
  clientName?: string;
  client?: string;
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
  save(sync = true): Promise<void> {
    if (sync) {
      let result: any = this.get();

      MCP_CONFIG_SYNC.set(result);
      MCP_CONFIG_SYNC.save();
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
export const zodVar = z.object({
  key: z.string(),
  name: z.string(),
  value: z.string(),
  scope: z.string(),
  variableStrategy: z.enum(["lazy", "immediate"]),
  variableType: z.enum(["string", "js", "webjs"]),
  code: z.string().optional(),
  description: z.string().optional(),
});


export type Var = z.infer<typeof zodVar>;

export const zodVarScope = z.object({
  key: z.string(),
  name: z.string(),
  type: z.enum(["builtin", "custom"]),
});
export type VarScope = z.infer<typeof zodVarScope>;


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