import type OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { v4 } from "uuid";
export const DataList: Data<any>[] = [];

export class Data<T> {
  private localStorage: any = null;
  private _inited = false;
  async init({ force } = { force: true }) {
    if (!force && this._inited) return this.data;
    this._inited = true;
    let localData = {};
    try {
      this.localStorage = await this.inget();
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
  // get d(): T {
  //   return this.data;
  // }
  format(x) {
    return x;
  };
  async save(format = (x: T) => x) {
    this.format = format;
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
    uuid: v4(),
  },
  {
    sync: false,
  }
);

export const AppSetting = new Data("app_setting.json", {
  isAutoLauncher: false,
  webdav: {
    url: "",
    username: "",
    password: "",
    baseDirName: "",
    // autoSync: false, // 废弃⚠️ => electronData
  },
  darkTheme: false,
  mcpCallToolTimeout: 60,
  defaultAllowMCPs: undefined as string[] | undefined,
  quicks: [{
    label: "Hello",
    value: "Hello",
    quick: "Hello"
  }] as Array<{
    value: string;
    label: string;
    quick: string;
  }>,
});

export type Tool_Call = {
  index: number;
  id: string;
  type: "function";
  origin_name?: string;
  restore_name?: string;
  function: {
    name: string;
    arguments: string;
    argumentsJSON: any;
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
  content_date: number;
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
  massagesHash?: string;
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
};

export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<ChatHistoryItem>,
});

export const Agents = new Data("gpts_list.json", {
  data: [] as Array<{
    key: string;
    label: string;
    prompt: string;
    description?: string;
    callable: boolean;
    allowMCPs: string[];
    modelKey?: string;
    attachedDialogueCount?: number;
    temperature?: number;
    confirm_call_tool: boolean;
  }>,
});

export const GPT_MODELS = new Data("gpt_models.json", {
  data: [] as Array<{
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
  }>,
});

class MCP_CONFIG_DATA<T> extends Data<T> {
  constructor(key: string, data: T, options) {
    super(key, data, options);
  }
}

export type MCP_CONFIG_TYPE = {
  command: string;
  args: string[];
  env: { [s: string]: string };
  url: string;
  type: "stdio" | "sse";
  hyperchat: {
    config: { [s in string]: any };
    url: string;
    type: "stdio" | "sse";
    scope: "built-in" | "outer";
  };
  disabled: boolean;
};

export type HyperChatCompletionTool = OpenAI.ChatCompletionTool & {
  origin_name?: string;
  restore_name?: string;
  clientName?: string;
  client?: string;
};
export type IMCPClient = {
  tools: Array<typeof MCPTypes.ToolSchema._type & HyperChatCompletionTool>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: "disconnected" | "connected" | "connecting" | "disabled";
  order: number;
  config: MCP_CONFIG_TYPE;
  ext: {
    configSchema?: { [s in string]: any };
  };
  source: "hyperchat" | "claude" | "builtin"
};
export const MCP_CONFIG = new MCP_CONFIG_DATA(
  "mcp.json",
  {
    mcpServers: {} as { [s: string]: MCP_CONFIG_TYPE },
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
