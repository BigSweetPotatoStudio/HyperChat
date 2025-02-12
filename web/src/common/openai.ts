import OpenAI from "openai";
import { getTools, HyperChatCompletionTool } from "./mcp";
import { call } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";

import { message as antdmessage } from "antd";
import type { ChatCompletionTool } from "openai/src/resources/chat/completions";
import { ChatCompletionContentPartText } from "openai/resources";
import imageBase64 from "../common/openai_image_base64.txt";

type Tool_Call = {
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

type ContentImage = {
  data: string;
  mimeType: string;
  type: string;
};

export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  tool_calls?: Tool_Call[]; // openai tool call
  content_status?:
    | "loading"
    | "success"
    | "error"
    | "dataLoading"
    | "dataLoadComplete";
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
  content_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

class ClientName2Index {
  obj: { [s: string]: number } = {};
  index = 0;
  getIndex(name: string) {
    if (!this.obj[name]) {
      this.obj[name] = this.index;
      this.index++;
    }
    return this.obj[name];
  }
  getName(index: number) {
    for (let key in this.obj) {
      if (this.obj[key] == index) {
        return key;
      }
    }
  }
}

export const clientName2Index = new ClientName2Index();

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

  constructor(
    public options: {
      baseURL: string;
      model: string;
      apiKey: string;
      call_tool_step?: number;
      supportTool?: boolean;
      supportImage?: boolean;
      allowMCPs?: string[];
    },
    public messages: MyMessage[],
    public stream = true,
  ) {
    this.openai = new OpenAI({
      baseURL: options.baseURL,
      apiKey: options.apiKey, // This is the default and can be omitted
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "https://www.dadigua.men", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "HyperChat", // Optional. Site title for rankings on openrouter.ai.
      },
    });
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
          text: message.content as string,
        },
      ];

      for (let r of resourceResList) {
        for (let content of r.contents) {
          if (content.text) {
            message.content.push({
              type: "text",
              text: content.text as string,
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
    if (promptResList.length > 0) {
      for (let p of promptResList) {
        for (let m of p.messages) {
          if (m.content.type == "text") {
            this.messages.push({
              role: m.role,
              content: m.content.text as string,
              content_from: p.call_name as string,
              content_attachment: [],
            });
          } else if (m.content.type == "resource") {
            if (m.content.resource.text) {
              this.messages.push({
                role: m.role,
                content: m.content.resource.text as string,
                content_from: p.call_name as string,
                content_attachment: [],
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
    this.messages.push(message);
    return this;
  }
  // 取消当前请求
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
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
      throw new Error("Cancel Requesting");
    }
    if (this.status == "stop") {
      throw new Error("Cancel Requesting");
    }
    let tools: HyperChatCompletionTool[];
    if (!call_tool || this.options.supportTool === false) {
      tools = undefined;
    } else {
      tools = getTools(
        (x) =>
          this.options.allowMCPs == null ||
          this.options.allowMCPs.includes(x.name),
      );
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
    };

    let messages = this.messages.filter(
      (m) => m.content_attached == null || m.content_attached == true,
    );
    this.messages.push(res as any);
    onUpdate && onUpdate(this.lastMessage.content as string);
    try {
      if (this.stream) {
        const stream = await this.openai.chat.completions.create(
          {
            messages: this.messages_format(messages),
            model: this.options.model,
            stream: true,
            stream_options: {
              include_usage: this.options.model == "qwen-plus" ? false : true, // qwen bug stream not support include_usage
            },
            tools: tools && this.tools_format(tools),
          },
          {
            signal: this.abortController.signal,
          },
        );
        this.lastMessage.content_status = "success";
        this.lastMessage.content_status = "dataLoading";
        onUpdate && onUpdate(res.content as string);

        for await (const chunk of stream) {
          // try {
          //   console.log(
          //     chunk.choices[0]?.delta?.tool_calls[0]?.function?.arguments,
          //   );
          // } catch (e) {}

          if (chunk.usage) {
            this.totalTokens = chunk.usage.total_tokens;
            res.content_usage.completion_tokens = chunk.usage.completion_tokens;
            res.content_usage.prompt_tokens = chunk.usage.prompt_tokens;
            res.content_usage.total_tokens = chunk.usage.total_tokens;
          }

          if (chunk.choices[0]?.delta?.tool_calls) {
            if (chunk.choices[0].delta.tool_calls.length > 1) {
              console.warn(
                "tool_calls length > 1",
                chunk.choices[0].delta.tool_calls,
              );
              // debugger;
              for (const tool_call of chunk.choices[0].delta.tool_calls) {
                let index = tool_call.index;
                if (typeof index !== "number") {
                  index = 0;
                }
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
            } else {
              const tool_call = chunk.choices[0].delta.tool_calls[0];
              let index = tool_call.index;
              if (typeof index !== "number") {
                index = 0;
              }
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
          onUpdate && onUpdate(res.content as string);
        }
        if (res.content == "") {
          res.content = undefined;
        }
      } else {
        const chatCompletion = await this.openai.chat.completions.create(
          {
            messages: this.messages_format(messages),
            model: this.options.model,
            tools: tools && this.tools_format(tools),
          },
          {
            signal: this.abortController.signal,
          },
        );
        this.lastMessage.content_status = "success";
        this.totalTokens = chatCompletion?.usage?.total_tokens;
        res.content_usage.completion_tokens =
          chatCompletion?.usage?.completion_tokens;
        res.content_usage.prompt_tokens = chatCompletion?.usage?.prompt_tokens;
        res.content_usage.total_tokens = chatCompletion?.usage?.total_tokens;

        let openaires =
          chatCompletion.choices[chatCompletion.choices.length - 1].message;

        let i = 0;
        for (let restool of openaires.tool_calls || []) {
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

        this.lastMessage.content = openaires.content;
        this.lastMessage.reasoning_content = (
          openaires as any
        ).reasoning_content;
      }
    } catch (e) {
      console.error(e);
      this.lastMessage.content_status = "error";
      onUpdate && onUpdate(this.lastMessage.content as string);
      throw e;
    }
    this.lastMessage.content_status = "dataLoadComplete";
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
        console.log("tool_calls", tool_calls);
        let localtool = tools.find(
          (t) => t.function.name === tool.function.name,
        );
        let clientName = localtool?.key;
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
        };
        this.messages.push(message as any);
        onUpdate && onUpdate(this.lastMessage.content as string);

        let call_res = await call("mcpCallTool", [
          clientName,
          localtool.origin_name,
          tool.function.argumentsJSON,
        ])
          .then((res) => {
            this.lastMessage.content_status = "success";
            onUpdate && onUpdate(this.lastMessage.content as string);
            return res;
          })
          .catch((e) => {
            this.lastMessage.content_status = "error";
            onUpdate && onUpdate(this.lastMessage.content as string);
            return {
              content: { error: e.message },
            };
          });
        console.log("call_res", call_res);

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
      console.log("this.messages", this.messages);
      return await this._completion(
        onUpdate,
        (this.options.call_tool_step || 10) > step + 1,
        step + 1,
        context,
      );
    } else {
      console.log("this.messages", this.messages);
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
        // {
        //   type: "function" as const,
        //   function: {
        //     name: "get_weather",
        //     parameters: {
        //       type: "object",
        //       properties: {
        //         location: { type: "string" },
        //       },
        //       required: ["location"],
        //       additionalProperties: false,
        //     },
        //     // returns: {
        //     //   type: "string",
        //     //   description: "The weather in the location",
        //     // },
        //   },
        // },
        {
          type: "function" as const,
          function: {
            name: "get_weather",
            description: "Get the weather in a given location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. Chicago, IL",
                },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          },
        },
      ];
      let messages: Array<any> = [
        {
          role: "user",
          content: "hello, What's the weather like in Chicago today?",
        },
      ];

      let response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
        tools,
        tool_choice: "auto",
      });
      messages.push(response.choices[0].message);

      let function_name =
        response.choices[0].message.tool_calls![0]["function"]["name"];
      let function_args =
        response.choices[0].message.tool_calls![0]["function"]["arguments"];

      let runs = {} as any;

      runs.get_weather = ({ location, unit }) => {
        return "25°C, sunny day.";
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
