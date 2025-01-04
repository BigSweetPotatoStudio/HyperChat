import OpenAI from "openai";
import { getTools, HyperChatCompletionTool } from "./mcp";
import { call } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { X } from "lucide-react";
import { message as antdmessage } from "antd";
import type { ChatCompletionTool } from "openai/src/resources/chat/completions";

type Tool_Call = {
  index: number;
  id: string;
  type: "function";
  origin_name: string;
  restore_name?: string;
  function: {
    name: string;
    arguments: string;
    argumentsJSON: any;
  };
};
export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  content_status?: "success" | "error";
  content_from?: string;
  tool_calls?: Tool_Call[];
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
  lastMessage: MyMessage;
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
    },
    public messages: MyMessage[],
    public stream = true,
  ) {
    this.openai = new OpenAI({
      baseURL: options.baseURL,
      apiKey: options.apiKey, // This is the default and can be omitted
      dangerouslyAllowBrowser: true,
    });
  }
  addMessage(
    message: MyMessage,
    resourceResList: Array<MCPTypes.ReadResourceResult> = [],
    promptResList: Array<MCPTypes.GetPromptResult> = [],
  ) {
    if (resourceResList.length > 0) {
      message.content += `
# Try to avoid using tools and use resources directly. \n`;

      for (let r of resourceResList) {
        for (let content of r.contents) {
          if (content.text) {
            message.content += `
## resources 1: 
`;
            message.content += content.text + "\n";
          } else {
            antdmessage.warning("resource 类型只支持文本");
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
            });
          } else if (m.content.type == "resource") {
            if (m.content.resource.text) {
              this.messages.push({
                role: m.role,
                content: m.content.resource.text as string,
                content_from: p.call_name as string,
              });
            } else {
              antdmessage.warning("resource 类型只支持文本");
            }
          } else {
            antdmessage.warning("prompt 类型只支持文本");
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
    if (!call_tool) {
      tools = undefined;
    } else {
      tools = await getTools();
      if (tools.length == 0) {
        tools = undefined;
      }
    }
    let tool_calls = [] as Array<Tool_Call>;
    // let content: string = "";
    this.abortController = new AbortController();
    let res = {
      role: "assistant",
      content: "",
      tool_calls: undefined,
    } as any as OpenAI.ChatCompletionMessage;

    let messages = this.messages.slice();
    this.lastMessage = res as any;
    this.messages.push(this.lastMessage);
    onUpdate && onUpdate(res.content);

    if (this.stream) {
      const stream = await this.openai.chat.completions.create(
        {
          messages: messages,
          model: this.options.model,
          stream: true,
          tools: tools,
        },
        {
          signal: this.abortController.signal,
        },
      );
      let totalTokens;
      for await (const chunk of stream) {
        if (chunk.usage) {
          totalTokens = chunk.usage.total_tokens;
        }

        if (chunk.choices[0].delta.tool_calls) {
          if (chunk.choices[0].delta.tool_calls.length > 1) {
            console.error("大错误，期待");
            debugger;
          }
          // console.log(
          //   "chunk.choices[0].delta.tool_calls",
          //   chunk.choices[0].delta.tool_calls[0],
          // );
          let tool = tool_calls[chunk.choices[0].delta.tool_calls[0].index];
          if (!tool) {
            tool = {
              index: chunk.choices[0].delta.tool_calls[0].index,
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
            tool_calls[chunk.choices[0].delta.tool_calls[0].index] = tool;
          }
          tool.function.name +=
            chunk.choices[0].delta.tool_calls[0].function.name || "";
          tool.function.arguments +=
            chunk.choices[0].delta.tool_calls[0].function.arguments || "";
          tool.id += chunk.choices[0].delta.tool_calls[0].id || "";
          // tool.index = chunk.choices[0].delta.tool_calls[0].index;
          // tool.type = chunk.choices[0].delta.tool_calls[0].type;
        }
        res.content += chunk.choices[0]?.delta?.content || "";
        onUpdate && onUpdate(res.content);
      }
      this.totalTokens = totalTokens;
    } else {
      const chatCompletion = await this.openai.chat.completions.create(
        {
          messages: messages,
          model: this.options.model,
          tools: tools,
        },
        {
          signal: this.abortController.signal,
        },
      );

      this.totalTokens = chatCompletion?.usage?.total_tokens;
      res = chatCompletion.choices[chatCompletion.choices.length - 1].message;

      let i = 0;
      for (let restool of res.tool_calls || []) {
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

      // this.lastMessage = res as any;
      // content = res.content;
      // this.messages.pop();
      // this.messages.push(this.lastMessage);
      // onUpdate && onUpdate(content);
    }
    this.lastMessage = res as any;
    onUpdate && onUpdate(res.content);

    tool_calls.forEach((tool) => {
      let localtool = tools.find((t) => t.function.name === tool.function.name);
      if (localtool) {
        tool.restore_name = localtool.restore_name;
        tool.origin_name = localtool.origin_name;
      }
    });

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
        let status = "success";

        let call_res = await call("mcpCallTool", [
          clientName,
          localtool.origin_name,
          tool.function.argumentsJSON,
        ]).catch((e) => {
          status = "error";
          return {
            content: { error: e.message },
          };
        });
        console.log("call_res", call_res);
        let content = "";
        if (call_res.content == null) {
          content = JSON.stringify(call_res);
        } else if (typeof call_res.content == "string") {
          content = call_res.content;
        } else {
          content = JSON.stringify(call_res.content);
        }
        let message = {
          role: "tool" as const,
          tool_call_id: tool.id,
          content: content,
          content_status: status as any,
        };

        this.messages.push(message);
        onUpdate && onUpdate("");
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
      return res.content;
    }
  }
  clear() {
    this.messages = this.messages.filter((m) => m.role === "system");
    this.lastMessage = null;
    this.totalTokens = 0;
  }
  async test() {
    let result = {
      code: 0,
      suppentTool: false,
    };
    try {
      this.stream = false;
      let messages: Array<any> = [{ role: "user", content: "你是谁?" }];
      let response = await this.openai.chat.completions.create({
        model: this.options.model,
        messages: messages,
      });
      console.log(response.choices[0].message.content);
      result.code = 1;
      try {
        const tools = [
          {
            type: "function" as const,
            function: {
              name: "get_weather",
              parameters: {
                type: "object",
                properties: {
                  location: { type: "string" },
                  unit: { type: "string", enum: ["c", "f"] },
                },
                required: ["location", "unit"],
                additionalProperties: false,
              },
              returns: {
                type: "string",
                description: "The weather in the location",
              },
            },
          },
        ];
        let messages: Array<any> = [
          { role: "user", content: "深圳天气今天怎么样?" },
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

        runs.get_weather = ({ location, unit }) => {
          return "25度, 晴天";
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
        result.suppentTool = true;
      } catch (e) {
        result.suppentTool = false;
      }
    } catch {
      result.code = 0;
    }
    return result;
  }
}
