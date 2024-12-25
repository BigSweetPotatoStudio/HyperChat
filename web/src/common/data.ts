import { call } from "./call";

class Data<T> {
  private localStorage = null;
  async init() {
    this.localStorage = await this.inget();
    try {
      this.data = Object.assign(
        {},
        this.data,
        this.localStorage ? JSON.parse(this.localStorage) : {},
      );
    } catch (e) {
      console.error(e);
    }
    return this.data;
  }
  constructor(
    private KEY: string,
    private data: T,
  ) {}
  get(): T {
    return this.data;
  }

  async save() {
    this.insave();
  }
  private async inget() {
    return await call("readFile", [this.KEY]).catch((e) => "");
  }
  private async insave() {
    return await call("writeFile", [
      this.KEY,
      JSON.stringify(this.data, null, 4),
    ]);
  }
}

export const AppSetting = new Data("app_setting.json", {
  isAutoLauncher: false,
  firstOpen: true,
});

await AppSetting.init();

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
  }>,
});

export const GPTS = new Data("gpts_list.json", {
  data: [] as Array<{
    key: string;
    label: string;
    prompt: string;
    description?: string;
    allowMCPs: string[];
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
  constructor(key: string, options: T) {
    super(key, options);
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

export const MCP_CONFIG = new MCP_CONFIG_DATA("mcp.json", {
  mcpServers: {} as {
    [s: string]: {
      command: string;
      args: string[];
      env: { [s: string]: string };
      disabled: boolean;
    };
  },
});

export const ENV_CONFIG = new Data("env.json", {
  PATH: "",
});
