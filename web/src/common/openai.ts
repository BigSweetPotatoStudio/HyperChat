
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
import type { GPT_MODELS_TYPE, MyMessage, Tool_Call } from "../../../common/data";
import { OpenAICompatibility } from "./openai-compatibility";
import type OpenAI from "openai";
import { extractTool } from "./ai/prompt";
// import OpenAICompatibility from "openai";

export {
  MyMessage,
  Tool_Call,
}



const deviceId = v4();
export class OpenAiChannel {
  openai: OpenAICompatibility;
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
      // provider?: string;  
      // call_tool_step?: number;
      // supportTool?: boolean;
      // supportImage?: boolean;
      // isStrict?: boolean;

      requestType?: "complete" | "stream";

      allowMCPs?: string[]; // agentData
      temperature?: number; // agentData
      confirm_call_tool?: boolean;
      confirm_call_tool_cb?: (tool: Tool_Call) => void;
      messages_format_callback?: (messages: MyMessage) => Promise<void>;
    } & Partial<GPT_MODELS_TYPE>,
    public messages: MyMessage[] = [],
  ) {

    this.openai = new OpenAICompatibility({
      baseURL: options.baseURL,
      apiKey: options.apiKey, // This is the default and can be omitted
      dangerouslyAllowBrowser: process.env.runtime !== "node",
      defaultHeaders: {
        "HTTP-Referer": "https://hyperchat.dadigua.men", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "HyperChat", // Optional. Site title for rankings on openrouter.ai.
        // baseURL: encodeURIComponent(options.baseURL),
      },
      fetch: async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
        // console.log('About to make a request', url, init);
        const response = await fetch(url, init);
        // console.log('Got response', response);
        // 兼容Gemini OpenAI 提示词错误
        if (response.status === 400) {
          let json = await response.clone().json();
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
    }, this.options);


    this.options.temperature =
      typeof this.options.temperature === "number"
        ? this.options.temperature
        : undefined;
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
    this.openai.modelData = this.options;

    let res = await this._completion(onUpdate, call_tool, step, {
      index: this.index,
    }).catch((e) => {
      this.status = "stop";
      throw e;
    });
    this.status = "stop";
    return res;
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
      try {
        if (process.env.runtime === "node") {
          tools = globalThis.getTools(this.options.allowMCPs);
        } else {
          tools = globalThis.getTools(this.options.allowMCPs);
        }
      } catch (e) {
        tools = []
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
      content_tool_calls: [],
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
        let format_message = await this.messages_format(messages);
        onUpdate && onUpdate(res.content as string);
        const stream = await this.openai.completion(
          {
            messages: format_message,
            model: this.options.model,
            stream: true,
            stream_options: {
              include_usage: true,
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
          if (chunk?.choices == null) {
            continue;
          }

          if (chunk?.choices[0]?.delta?.tool_calls) {

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
                    argumentsOBJ: {},
                  },
                };
                tool_calls[index] = tool;
              }
              tool.function.name += tool_call.function.name || "";

              tool.function.arguments += tool_call.function.arguments || "";
              tool.id += tool_call.id || "";
            }
          }

          res.content += (chunk.choices[0]?.delta?.content || "");
          res.reasoning_content +=
            (chunk.choices[0]?.delta as any)?.reasoning_content || (chunk.choices[0]?.delta as any)?.reasoning || "";
          res.content_date = Date.now();
          onUpdate && onUpdate(res.content as string);
        }
        // if (res.content == "") {
        //   res.content = undefined;
        // }
        onUpdate && onUpdate(res.content as string);
      } else {
        let format_message = await this.messages_format(messages);
        onUpdate && onUpdate(res.content as string);
        const chatCompletion = await this.openai.completion(
          {
            messages: format_message,
            model: this.options.model,
            tools: tools && this.tools_format(tools),
            temperature: this.options.temperature,
          },
          {
            signal: this.abortController.signal,
          },
        );

        if (!Array.isArray(chatCompletion.choices)) {
          console.log("chatCompletion", chatCompletion);
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
                argumentsOBJ: {},
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
        this.lastMessage.reasoning_content = (lastMessage as any).reasoning_content || (lastMessage as any).reasoning;
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

    if (this.options.toolMode == "compatible" && (this.lastMessage.content.toString()).includes("<tool_use>")) {
      let res = extractTool(this.lastMessage.content.toString());
      if (res) {
        tool_calls.push({
          index: 0,
          id: res.name,
          type: "function",
          function: {
            name: res.name,
            arguments: JSON.stringify(res.params),
            argumentsOBJ: res.params,
          }
        });
        // this.lastMessage.content = "";
      }
    }

    tool_calls.forEach((tool) => {
      let localtool = tools.find((t) => t.function.name === tool.function.name);
      if (localtool) {
        tool.restore_name = localtool.restore_name;
        tool.origin_name = localtool.origin_name;
      }
      if (tool.id == "") {
        tool.id = v4();
      }
    });
    onUpdate && onUpdate(this.lastMessage.content as string);
    // console.log("tool_calls", tool_calls, call_tool);
    if (tool_calls.length > 0 && call_tool) {
      this.lastMessage.content_tool_calls = tool_calls;
      for (let tool of tool_calls) {
        try {
          tool.function.argumentsOBJ = JSON.parse(tool.function.arguments);
          if (typeof tool.function.argumentsOBJ != "object") {
            tool.function.argumentsOBJ = {} as any;
            tool.function.arguments = "{}";
          }
        } catch {
          tool.function.argumentsOBJ = {} as any;
          tool.function.arguments = "{}";
        }
        if (process.env.runtime !== "node") {
          if (
            this.options.confirm_call_tool &&
            this.options.confirm_call_tool_cb
          ) {
            try {
              tool.function.argumentsOBJ =
                await this.options.confirm_call_tool_cb(tool);

            } catch (e) {

              let message: MyMessage = {
                role: "tool" as const,
                tool_call_id: tool.id,
                content: "this tool call canceled by user.",
                content_status: "error",
                content_attachment: [],
                content_date: Date.now(),
              };
              this.messages.push(message as any);
              onUpdate && onUpdate(this.lastMessage.content as string);
              continue;
            }

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
          try {
            if (
              clientName === "hyper_agent" &&
              localtool.origin_name == "call_agent"
            ) {
              (await callModule.getWebSocket()).emit("active", deviceId);
            }
          } catch (e) {
            console.error(e);
          }
        }
        this.mcpAbortController = new AbortController();
        let call_res = await globalThis.ext2.call(
          "mcpCallTool",
          [clientName, localtool.origin_name, tool.function.argumentsOBJ],
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
          let contents = []
          for (let c of call_res.content) {
            if (c.type == "text") {
              contents.push(c.text);
            } else if (c.type == "image") {
              this.lastMessage.content_attachment.push(c);
            } else {
              antdmessage.warning("tool 返回类型只支持 text image");
            }
          }
          this.lastMessage.content = contents.join("\n");
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
  getRelay(index: number) {
    let assistantContent = [];
    if (this.messages[index].role == "user") {
      index++;
    }
    while (this.messages.length > index) {
      let m = this.messages[index];
      if (m.role == "user") {
        break;
      } else if (m.role == "assistant") {
        if (typeof m.content == "string") {
          assistantContent.push(m.content);
        } else if (Array.isArray(m.content)) {
          for (let c of m.content) {
            if (c.type == "text") {
              assistantContent.push(c.text);
            } else if (c.type == "refusal") {
              assistantContent.push(c.refusal);
            } else {
              console.warn("tool 返回类型只支持 text");
            }
          }
        }
      }
      index++;
    }
    return assistantContent.join("\n").split("\n").filter((x) => x).join("\n");
  }

  async completionParse(response_format: any): Promise<any> {
    this.openai.modelData = this.options;

    let completion = await this.openai.parse({
      messages: await this.messages_format(this.messages),
      model: this.options.model,
      temperature: this.options.temperature,
      response_format: response_format,
    });
    const res = completion.choices[0].message

    // If the model refuses to respond, you will get a refusal message
    if (res.refusal) {
      throw new Error(res.refusal)
    } else {
      return res.parsed
    }
  }
  // clear() {
  //   this.messages = this.messages.filter((m) => m.role === "system");
  //   this.totalTokens = 0;
  // }
  async testBase() {

    let messages: Array<any> = [{ role: "user", content: "你是谁?" }];
    let response = await this.openai.completion({
      model: this.options.model,
      messages: messages,
    });
    console.log(response.choices[0].message.content);

  }
  async testImage() {

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
    let response = await this.openai.completion({
      model: this.options.model,
      messages: messages,
    });
    console.log(response.choices[0].message.content);

  }
  async testTool() {

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

    let response = await this.openai.completion({
      model: this.options.model,
      messages: messages,
      tools,
    });

    messages.push(response.choices[0].message);

    let tool_calls = response.choices[0].message.tool_calls || [];
    if (this.options.toolMode == "compatible" && (response.choices[0].message.content.toString()).includes("<tool_use>")) {
      let res = extractTool(response.choices[0].message.content.toString());
      if (res) {
        tool_calls.push({
          id: res.name,
          type: "function",
          function: {
            name: res.name,
            arguments: JSON.stringify(res.params),
          }
        });
      }
    }

    let runs = {} as any;

    let function_name = tool_calls![0]["function"]["name"];
    let function_args = tool_calls![0]["function"]["arguments"];
    runs[function_name] = () => {
      return dayjs().format("YYYY-MM-DD HH:mm:ss");
    };

    console.log(function_name, function_args);

    let res = runs[function_name](function_args);
    // console.log(res);

    messages.push({
      role: "tool",
      tool_call_id: tool_calls![0]["id"],
      content: res,
    });

    response = await this.openai.completion({
      model: this.options.model,
      messages: messages,
      tools,
    });
    console.log(response.choices[0].message.content);

  }
  async messages_format(messages: MyMessage[]): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    let results = []
    for (let m of messages) {
      this.options.messages_format_callback && await this.options.messages_format_callback(m);
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
        content_sended,
        content_template,
        content_tool_calls,
        ...rest
      } = m;
      if (rest.role == "assistant") {
        rest.tool_calls = content_tool_calls?.map((x: Tool_Call) => {
          let { origin_name, restore_name, ...rest } = x;
          let { argumentsOBJ, ...functionRest } = rest.function;
          rest.function = functionRest as any;
          return rest;
        }) as any;
      }
      if (rest.content == "") {
        rest.content = " ";
      }
      results.push(rest);
    }
    return results;
  }
  tools_format(tools: HyperChatCompletionTool[]) {
    return tools?.map((x) => {
      let { origin_name, restore_name, key, client, clientName, ...rest } = x;
      if (this.options.isStrict) {
        rest.function.strict = true;
        rest.function.parameters = formatProperties(rest.function.parameters, false);
      } else {
        delete rest.function.strict;
        rest.function.parameters = formatProperties(rest.function.parameters, true);
      }
      return rest;
    });
  }
}



export function formatProperties(obj: any, delAdditionalProperties: boolean) {

  if (obj == null) {
    return {
      compatible: {
        type: "string",
        description: "ignore, no enter", // compatible gemini-openai
      },
    };
  }

  try {
    // 处理对象类型
    if (obj.type === "object") {
      // 递归处理所有属性
      if (obj.properties) {
        for (const key in obj.properties) {
          const item = obj.properties[key];
          if (!item) continue;

          if (item.type === "object") {
            obj.properties[key] = formatProperties(item, delAdditionalProperties);
          } else if (item.type === "array" && item.items) {
            obj.properties[key].items = formatProperties(item.items, delAdditionalProperties);
          }
        }
      }

      // 删除不需要的属性
      if (delAdditionalProperties && obj.additionalProperties !== undefined) {
        delete obj.additionalProperties;
      }

      // 对象类型不应该有items属性，删除它
      delete obj.items;
    }
    // 处理数组类型
    else if (obj.type === "array") {
      // 递归处理数组项
      if (obj.items) {
        obj.items = formatProperties(obj.items, delAdditionalProperties);

        // 删除数组项中的additionalProperties
        if (delAdditionalProperties && obj.items.additionalProperties !== undefined) {
          delete obj.items.additionalProperties;
        }
      }

      // 数组类型不应该有properties属性，删除它
      delete obj.properties;
    }
  } catch (e) {
    console.error(e);
  }
  // console.log(obj);
  return obj;
}
