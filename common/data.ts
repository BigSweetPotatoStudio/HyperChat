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
  },
});

export const DownloadVideo = new Data("download_video.json", {
  data: [] as Array<{
    title: string;
    filename: string;
    state: string;
    uuid: string;
  }>,
});

export const ChatHistory = new Data("chat_history.json", {
  data: [] as Array<{
    label: string;
    key: string;
    messages: Array<{ role: string; content: string }>;
    modelKey: string;
    gptsKey: string;
    sended: boolean;
    icon: string;
    allowMCPs: string[];
    requestType: string;
  }>,
});

export const GPTS = new Data("gpts_list.json", {
  data: [] as Array<{
    key: string;
    label: string;
    prompt: string;
    description?: string;
    allowMCPs: string[];
    modelKey?: string;
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

export const MCP_CONFIG = new MCP_CONFIG_DATA(
  "mcp.json",
  {
    mcpServers: {} as {
      [s: string]: {
        command: string;
        args: string[];
        env: { [s: string]: string };
        disabled: boolean;
      };
    },
  },
  {
    sync: false,
  }
);

export const taskHistory = new Data("taskHistory.json", {
  history: [],
});
