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

export const electronData = new Data(
  "electronData.json",
  {
    port: 0,
    password: "123456",
    mcp_server_port: 0,
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
});

export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<any>;
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
  hyperchat: {
    config: { [s in string]: any };
    url: string;
    type: "stdio" | "sse";
    scope: "built-in" | "outer";
  };
  disabled: boolean;
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
