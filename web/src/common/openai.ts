import OpenAI from "openai";

import type { HyperChatCompletionTool } from "./mcp";
// import { call, getURL_PRE, getWebSocket } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";

let antdmessage: { warning: (msg: string) => void };
let callModule = {
  getURL_PRE: () => "",
  getWebSocket: () => null,
};
if (process.env.runtime === "node") {
  antdmessage = { warning: console.warn };
} else {
  const { message } = await import("antd");
  antdmessage = { warning: message.warning };
  let call = await import("./call");
  callModule.getURL_PRE = call.getURL_PRE;
  callModule.getWebSocket = call.getWebSocket;
}

import imageBase64 from "../common/openai_image_base64.txt";
import { v4 } from "uuid";
import dayjs from "dayjs";
import { isOnBrowser } from "./const";
import type { MyMessage, Tool_Call } from "../../../common/data";



export {
  MyMessage,
  Tool_Call,
}
// export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
//   tool_calls?: Tool_Call[]; // openai tool call
//   content_status?:
//   | "loading"
//   | "success"
//   | "error"
//   | "dataLoading"
//   | "dataLoadComplete";
//   content_error?: string;
//   content_from?: string;
//   content_attachment?: Array<{
//     type: string;
//     text?: string;
//     mimeType?: string;
//     data?: string;
//   }>;
//   reasoning_content?: string;
//   content_context?: any;
//   content_attached?: boolean;
//   content_date: number;
//   content_usage?: {
//     prompt_tokens: number;
//     completion_tokens: number;
//     total_tokens: number;
//   };
// };

// class ClientName2Index {
//   obj: { [s: string]: number } = {};
//   index = 0;
//   getIndex(name: string) {
//     if (!this.obj[name]) {
//       this.obj[name] = this.index;
//       this.index++;
//     }
//     return this.obj[name];
//   }
//   getName(index: number) {
//     for (let key in this.obj) {
//       if (this.obj[key] == index) {
//         return key;
//       }
//     }
//   }
// }

// export const clientName2Index = new ClientName2Index();
const cache = new Map<string, any>();

const deviceId = v4();
export class OpenAiChannel {
  openai: OpenAI;
  get lastMessage(): MyMessage {
    return this.messages[this.messages.length - 1];
  }
  totalTokens = 0;
  get estimateTotalTokens() {
    let total = 0;
    for (let m of this.messages) {
      total += m.content.length;
    }
    return total;
  }
  private abortController: AbortController | null = null;
  private mcpAbortController: AbortController | null = null;

  constructor(
    public options: {
      baseURL: string;
      apiKey: string;
      model?: string;
      requestType?: "complete" | "stream";
      call_tool_step?: number;
      supportTool?: boolean;
      supportImage?: boolean;
      allowMCPs?: string[];
      temperature?: number;
      confirm_call_tool?: boolean;
      confirm_call_tool_cb?: (tool: Tool_Call) => void;
    },
    public messages: MyMessage[],
    // public stream = true,
  ) {
    this.openai = new OpenAI({
      baseURL:
        process.env.runtime === "node"
          ? options.baseURL
          : isOnBrowser
            ? callModule.getURL_PRE() + "api/proxy"
            : options.baseURL,

      apiKey: options.apiKey, // This is the default and can be omitted
      dangerouslyAllowBrowser: process.env.runtime !== "node",
      defaultHeaders: {
        "HTTP-Referer": "https://hyperchat.dadigua.men", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "HyperChat", // Optional. Site title for rankings on openrouter.ai.
        baseURL: encodeURIComponent(options.baseURL),
      },
      fetch: async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
        // console.log('About to make a request', url, init);
        const response = await fetch(url, init);
        // console.log('Got response', response);
        // 兼容Gemini OpenAI 提示词错误
        if (response.status === 400) {
          let json = await response.json();
          if (Array.isArray(json)) {
            let res = {
              error: {
                message: "",
              }
            }
            for (let r of json) {
              res.error.message += r.error.message + "\n";
            }
            return new Response(JSON.stringify(res), {
              status: 400,
            });
          }
        }
        return response;
      },
    });
    this.options.temperature =
      typeof this.options.temperature === "number"
        ? this.options.temperature
        : undefined;
  }
  static create(options: {
    baseURL: string;
    apiKey: string;
  }, cacheKey: string = ""): OpenAiChannel {
    cacheKey = cacheKey + options.baseURL + options.apiKey;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    let openai = new OpenAiChannel({
      baseURL: options.baseURL,
      apiKey: options.apiKey,

    }, []);
    cache.set(cacheKey, openai);
    return openai;
  }
  addMessage(
    message: MyMessage,
    resourceResList: Array<MCPTypes.ReadResourceResult> = [],
    promptResList: Array<MCPTypes.GetPromptResult> = [],
  ) {
    if (resourceResList.length > 0) {
      message.content = [
        {
          type: "text",
          text: message.content.toString() as string,
        },
      ];

      for (let r of resourceResList) {
        for (let content of r.contents) {
          if (content.text) {
            message.content.push({
              type: "text",
              text: content.text.toString() as string,
            });
          } else if (content.type == "image") {
            message.content.push({
              type: "image_url",
              image_url: { url: content.blob },
            } as any);
          } else {
            antdmessage.warning("resource only supports text + images.");
          }
        }
      }
    }
    this.messages.push(message);
    if (promptResList.length > 0) {
      for (let p of promptResList) {
        for (let m of p.messages) {
          if (m.content.type == "text") {
            this.messages.push({
              role: m.role,
              content: m.content.text as string,
              content_from: p.call_name as string,
              content_attachment: [],
              content_date: Date.now(),
            });
          } else if (m.content.type == "resource") {
            if (m.content.resource.text) {
              this.messages.push({
                role: m.role,
                content: m.content.resource.text as string,
                content_from: p.call_name as string,
                content_attachment: [],
                content_date: Date.now(),
              });
            } else if (
              m.content.resource.blob &&
              m.content.resource?.mimeType.startsWith("image")
            ) {
              if (m.role == "user") {
                this.messages.push({
                  role: m.role as "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: { url: m.content.resource.blob } as any,
                    },
                  ],
                  content_from: p.call_name as string,
                  content_attachment: [],
                  content_date: Date.now(),
                });
              } else {
                antdmessage.warning(
                  "openai only user role support submit image.",
                );
              }
            } else {
              antdmessage.warning("resource only supports text + images.");
            }
          } else {
            antdmessage.warning("prompt only supports text + resource.");
          }
        }
      }
    }

    return this;
  }
  // 取消当前请求
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.mcpAbortController) {
      this.mcpAbortController.abort();
      this.mcpAbortController = null;
    }
    this.status = "stop";
  }
  index = 0;
  status: "runing" | "stop" = "stop";
  async completion(
    onUpdate?: (content: string) => void,
    call_tool: boolean = true,
    step = 0,
  ): Promise<string> {
    this.status = "runing";
    this.index++;
    return await this._completion(onUpdate, call_tool, step, {
      index: this.index,
    });
  }
  async _completion(
    onUpdate?: (content: string) => void,
    call_tool: boolean = true,
    step = 0,
    context: { index: number } = { index: 0 },
  ): Promise<string> {
    if (context.index < this.index) {
      throw new Error("User Cancel Requesting");
    }
    if (this.status == "stop") {
      throw new Error("User Cancel Requesting");
    }
    let tools: HyperChatCompletionTool[];
    if (!call_tool || this.options.supportTool === false) {
      tools = undefined;
    } else {
      if (process.env.runtime === "node") {
        tools = global.tools || [];
      } else {
        const { getTools } = await import("./mcp");
        tools = getTools(this.options.allowMCPs);
      }

      if (tools.length == 0) {
        tools = undefined;
      }
    }
    let tool_calls = [] as Array<Tool_Call>;
    // let content: string = "";
    this.abortController = new AbortController();
    let res: MyMessage = {
      role: "assistant",
      content: "" as any,
      reasoning_content: "",
      tool_calls: undefined,
      content_status: "loading",
      content_attachment: [],
      content_usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      content_date: Date.now(),
    };

    let messages = this.messages.filter(
      (m) => m.content_attached == null || m.content_attached == true,
    );
    this.messages.push(res as any);
    onUpdate && onUpdate(this.lastMessage.content as string);
    try {
      if (this.options.requestType === "stream") {
        const stream = await this.openai.chat.completions.create(
          {
            messages: this.messages_format(messages),
            model: this.options.model,
            stream: true,
            stream_options: {
              include_usage: true, // qwen bug stream not support include_usage
            },
            tools: tools && this.tools_format(tools),
            temperature: this.options.temperature,
          },
          {
            signal: this.abortController.signal,
          },
        );
        this.lastMessage.content_status = "success";
        this.lastMessage.content_status = "dataLoading";
        onUpdate && onUpdate(res.content as string);

        for await (const chunk of stream) {

          if (chunk.usage) {
            this.totalTokens = chunk.usage.total_tokens;
            res.content_usage.completion_tokens = chunk.usage.completion_tokens;
            res.content_usage.prompt_tokens = chunk.usage.prompt_tokens;
            res.content_usage.total_tokens = chunk.usage.total_tokens;
          }

          if (chunk.choices[0]?.delta?.tool_calls) {

            for (const [
              i,
              tool_call,
            ] of chunk.choices[0].delta.tool_calls.entries()) {
              let index = tool_call.index || i;

              let tool = tool_calls[index];
              if (!tool) {
                tool = {
                  index: index,
                  id: "",
                  type: "function",
                  restore_name: "",
                  origin_name: "",
                  function: {
                    name: "",
                    arguments: "",
                    argumentsJSON: {},
                  },
                };
                tool_calls[index] = tool;
              }
              tool.function.name += tool_call.function.name || "";

              tool.function.arguments += tool_call.function.arguments || "";
              tool.id += tool_call.id || "";
            }
          }

          res.content += chunk.choices[0]?.delta?.content || "";
          res.reasoning_content +=
            (chunk.choices[0]?.delta as any)?.reasoning_content || "";
          res.content_date = Date.now();
          onUpdate && onUpdate(res.content as string);
        }
        // if (res.content == "") {
        //   res.content = undefined;
        // }
        onUpdate && onUpdate(res.content as string);
      } else {
        const chatCompletion = await this.openai.chat.completions.create(
          {
            messages: this.messages_format(messages),
            model: this.options.model,
            tools: tools && this.tools_format(tools),
            temperature: this.options.temperature,
          },
          {
            signal: this.abortController.signal,
          },
        );

        if (!Array.isArray(chatCompletion.choices)) {
          throw new Error(
            (chatCompletion as any)?.error?.message ||
            "Provider returned error",
          );
        }
        this.lastMessage.content_status = "success";
        this.totalTokens = chatCompletion?.usage?.total_tokens;
        res.content_usage.completion_tokens =
          chatCompletion?.usage?.completion_tokens;
        res.content_usage.prompt_tokens = chatCompletion?.usage?.prompt_tokens;
        res.content_usage.total_tokens = chatCompletion?.usage?.total_tokens;

        let lastMessage =
          chatCompletion.choices[chatCompletion.choices.length - 1].message;

        let i = 0;
        for (let restool of lastMessage.tool_calls || []) {
          let tool = tool_calls[i];
          if (!tool) {
            tool = {
              index: i,
              id: "",
              type: "function",

              restore_name: "",
              origin_name: "",
              function: {
                name: "",

                arguments: "",
                argumentsJSON: {},
              },
            };
            tool_calls[i] = tool;
          }
          tool_calls[i].index = i;
          tool.function.name += restool.function.name || "";
          tool.function.arguments += restool.function.arguments || "";
          tool.id += restool.id || "";
          i++;
        }

        this.lastMessage.content = lastMessage.content;
        this.lastMessage.reasoning_content = (
          lastMessage as any
        ).reasoning_content;
      }
    } catch (e) {
      this.lastMessage.content_status = "error";
      onUpdate && onUpdate(this.lastMessage.content as string);
      throw e;
    }
    this.lastMessage.content_status = "dataLoadComplete";
    this.lastMessage.content_date = Date.now();
    // if (this.lastMessage.reasoning_content) {
    //   this.lastMessage.content_attachment.push({
    //     type: "text",
    //     text: this.lastMessage.reasoning_content,
    //   });
    // }
    onUpdate && onUpdate(this.lastMessage.content as string);

    tool_calls.forEach((tool) => {
      let localtool = tools.find((t) => t.function.name === tool.function.name);
      if (localtool) {
        tool.restore_name = localtool.restore_name;
        tool.origin_name = localtool.origin_name;
      }
    });
    onUpdate && onUpdate(this.lastMessage.content as string);
    // console.log("tool_calls", tool_calls, call_tool);
    if (tool_calls.length > 0 && call_tool) {
      this.lastMessage.tool_calls = tool_calls;
      for (let tool of tool_calls) {
        try {
          tool.function.argumentsJSON = JSON.parse(tool.function.arguments);
        } catch {
          tool.function.argumentsJSON = {} as any;
        }
        if (process.env.runtime !== "node") {
          if (
            this.options.confirm_call_tool &&
            this.options.confirm_call_tool_cb
          ) {
            tool.function.argumentsJSON =
              await this.options.confirm_call_tool_cb(tool);
            tool.function.arguments = JSON.stringify(
              tool.function.argumentsJSON,
            );
          }
        }
        // console.log("tool_calls", tool_calls);
        let localtool = tools.find(
          (t) => t.function.name === tool.function.name,
        );
        let clientName = localtool?.clientName;
        if (!clientName) {
          console.error("client not found", tool);
          throw new Error("client not found");
        }

        let message: MyMessage = {
          role: "tool" as const,
          tool_call_id: tool.id,
          content: "",
          content_status: "loading",
          content_attachment: [],
          content_date: Date.now(),
        };
        this.messages.push(message as any);
        onUpdate && onUpdate(this.lastMessage.content as string);
        if (process.env.runtime !== "node") {
          if (
            clientName === "hyper_agent" &&
            localtool.origin_name == "call_agent"
          ) {
            (await callModule.getWebSocket()).emit("active", deviceId);
          }
        }

        let call_res = await globalThis.ext2.call(
          "mcpCallTool",
          [clientName, localtool.origin_name, tool.function.argumentsJSON],
          {
            signal: this.mcpAbortController?.signal,
          },
        )
          .then((res) => {
            if (res["isError"]) {
              this.lastMessage.content_status = "error";
              onUpdate && onUpdate(this.lastMessage.content as string);
              return res;
            } else {
              this.lastMessage.content_status = "success";
              onUpdate && onUpdate(this.lastMessage.content as string);
              return res;
            }
          })
          .catch((e) => {
            this.lastMessage.content_status = "error";
            onUpdate && onUpdate(this.lastMessage.content as string);
            return {
              content: { error: e.message },
            };
          });
        // console.log("call_response: ", call_res);

        if (call_res.content == null) {
          this.lastMessage.content = JSON.stringify(call_res);
        } else if (typeof call_res.content == "string") {
          this.lastMessage.content = call_res.content;
        } else if (Array.isArray(call_res.content)) {
          for (let c of call_res.content) {
            if (c.type == "text") {
            } else if (c.type == "image") {
              this.lastMessage.content_attachment.push(c);
            } else {
              antdmessage.warning("tool 返回类型只支持 text image");
            }
          }
          this.lastMessage.content = call_res.content
            .filter((x) => x.type == "text")
            .map((x) => x.text)
            .join("\n");
        } else {
          this.lastMessage.content = JSON.stringify(call_res.content);
        }
        onUpdate && onUpdate(this.lastMessage.content as string);
      }
      // console.log("this.messages", this.messages);
      return await this._completion(
        onUpdate,
        (this.options.call_tool_step || 10) > step + 1,
        step + 1,
        context,
      );
    } else {
      // console.log("this.messages", this.messages);
      return res.content as string;
    }
  }
  clear() {
    this.messages = this.messages.filter((m) => m.role === "system");
    this.totalTokens = 0;
  }
  async testBase() {
    try {
      let messages: Array<any> = [{ role: "user", content: "你是谁?" }];
      let response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
      });
      console.log(response.choices[0].message.content);
      return true;
    } catch (e) {
      return false;
    }
  }
  async testImage() {
    try {
      let messages: Array<any> = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
            {
              type: "text",
              text: "这是什么图片",
            },
          ],
        },
      ];
      let response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
      });
      console.log(response.choices[0].message.content);
      return true;
    } catch (e) {
      return false;
    }
  }
  async testTool() {
    try {
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "current_time",
            description: "Get the current local time as a string.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
      ];
      let messages: Array<any> = [
        {
          role: "user",
          content: "hello, What's the time?",
        },
      ];

      let response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
        tools,
      });

      messages.push(response.choices[0].message);

      let function_name =
        response.choices[0].message.tool_calls![0]["function"]["name"];
      let function_args =
        response.choices[0].message.tool_calls![0]["function"]["arguments"];

      let runs = {} as any;

      runs[function_name] = () => {
        return dayjs().format("YYYY-MM-DD HH:mm:ss");
      };

      console.log(function_name, function_args);

      let res = runs[function_name](function_args);
      // console.log(res);

      messages.push({
        role: "tool",
        tool_call_id: response.choices[0].message.tool_calls![0]["id"],
        content: res,
      });

      response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
        tools,
      });
      console.log(response.choices[0].message.content);
      return true;
    } catch (e) {
      return false;
    }
  }
  messages_format(messages: MyMessage[]) {
    return messages.map((m) => {
      let {
        content_attachment,
        content_attached,
        content_context,
        content_from,
        content_status,
        content_usage,
        reasoning_content,
        content_error,
        content_date,
        ...rest
      } = m;
      if (rest.role == "assistant") {
        rest.tool_calls = rest.tool_calls?.map((x: Tool_Call) => {
          let { origin_name, restore_name, ...rest } = x;
          let { argumentsJSON, ...functionRest } = rest.function;
          rest.function = functionRest as any;
          return rest;
        }) as any;
      }
      return rest;
    });
  }
  tools_format(tools) {
    return tools?.map((x) => {
      let { origin_name, restore_name, key, client, clientName, ...rest } = x;

      return rest;
    });
  }
}
