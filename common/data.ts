export const DataList: Data<any>[] = [];

export class Data<T> {
  private localStorage: any = null;
  async init(isCatch = true) {
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
  initSync(isCatch = true) {
    let localData = {};
    try {
      this.localStorage = this.ingetSync();
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

  async save() {
    this.insave();
  }
  private inget(): Promise<T> {
    throw new Error("Method not implemented.");
  }
  private ingetSync(): Promise<T> {
    throw new Error("Method not implemented.");
  }
  private insave(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public override({ inget, ingetSync, insave }) {
    this.inget = inget;
    this.ingetSync = ingetSync;
    this.insave = insave;
  }
}

export const electronData = new Data(
  "electronData.json",
  {
    port: 0,
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
    autoSync: false,
  },
});

export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<any>;
  modelKey: string;
  gptsKey: string;
  sended: boolean;
  icon: string;
  allowMCPs: string[];
  requestType: string;
  attachedDialogueCount?: number;
  dateTime: number;
};
export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<ChatHistoryItem>,
});

export const GPTS = new Data("gpts_list.json", {
  data: [] as Array<{
    key: string;
    label: string;
    prompt: string;
    description?: string;
    allowMCPs: string[];
    modelKey?: string;
    attachedDialogueCount?: number;
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
  }>,
});

class MCP_CONFIG_DATA<T> extends Data<T> {
  constructor(key: string, data: T, options) {
    super(key, data, options);
  }
  save() {
    let mcpServers = (this.get() as any).mcpServers;
    for (const x in mcpServers) {
      for (const key in mcpServers[x]) {
        let server = mcpServers[x];
        if (key.startsWith("_")) {
          delete server[key];
        }
      }
    }
    return super.save();
  }
}

export type MCP_CONFIG_TYPE = {
  command: string;
  args: string[];
  env: { [s: string]: string };
  hyperchat: {
    config: any;
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

export const taskHistory = new Data("taskHistory.json", {
  history: [],
});

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
  type: "file" | "markdown";
  fragments?: KNOWLEDGE_Resource_Fragment[];
  filepath?: string;
  markdown?: string;
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
