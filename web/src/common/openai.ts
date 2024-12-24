import OpenAI from "openai";
import { getTools } from "./mcp";
import { call } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { X } from "lucide-react";
import { message as antdmessage } from "antd";

export type MyMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam & {
  content_status?: "success" | "error";
  content_from?: string;
  tool_calls?: any;
};

export class OpenAiChannel {
  openai: OpenAI;
  lastMessage: MyMessage;
  totalTokens = 0;
  private abortController: AbortController | null = null;

  constructor(
    public options: {
      baseURL: string;
      model: string;
      apiKey: string;
      call_tool_step?: number;
      stream?: boolean;
    },
    public messages: MyMessage[],
  ) {
    options.stream = options.stream || true;
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
      message.content += `# Try to avoid using tools and use resources directly. \n`;
      message.content += `
## resources 1: 
`;
      for (let r of resourceResList) {
        for (let content of r.contents) {
          if (content.text) {
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
  }
  index = 0;
  async completion(
    onUpdate?: (content: string) => void,
    call_tool: boolean = true,
    step = 0,
  ): Promise<string> {
    this.index++;
    let tools;
    if (!call_tool) {
      tools = undefined;
    } else {
      tools = await getTools();
      if (tools.length == 0) {
        tools = undefined;
      }
    }
    let tool_calls = [] as Array<{
      index: number;
      id: "";
      type: "function";
      function: {
        name: "";
        arguments: "";
        argumentsJSON: {};
      };
    }>;
    let content: string = "";
    this.abortController = new AbortController();
    let res = {
      role: "assistant",
      content: content,
      tool_calls: undefined,
    } as any as OpenAI.ChatCompletionMessage;

    let messages = this.messages.slice();
    this.lastMessage = res;
    this.messages.push(this.lastMessage);
    onUpdate && onUpdate(content);

    if (this.options.stream) {
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

      for await (const chunk of stream) {
        if (chunk.usage) {
          this.totalTokens = chunk.usage.total_tokens;
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
        content += chunk.choices[0]?.delta?.content || "";
        this.lastMessage.content = content;
        onUpdate && onUpdate(content);
      }
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

      this.totalTokens = chatCompletion.usage.total_tokens;
      res = chatCompletion.choices[chatCompletion.choices.length - 1].message;

      let i = 0;
      for (let restool of res.tool_calls || []) {
        let tool = tool_calls[i];
        if (!tool) {
          tool = {
            index: i,
            id: "",
            type: "function",
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
      this.lastMessage = res;
      content = res.content;
      this.messages.pop();
      this.messages.push(this.lastMessage);
      onUpdate && onUpdate(content);
    }
    if (tool_calls.length > 0 && call_tool) {
      this.lastMessage.tool_calls = tool_calls;
      for (let tool of tool_calls) {
        try {
          tool.function.argumentsJSON = JSON.parse(tool.function.arguments);
        } catch {
          tool.function.argumentsJSON = {} as any;
        }
        console.log("tool_calls", tool_calls);
        let client = tools.find(
          (t) => t.function.name === tool.function.name,
        )?.key;
        if (!client) {
          console.error("client not found", tool);
          throw new Error("client not found");
        }
        let status = "success";
        let call_res = await call("mcpCallTool", [
          client,
          tool.function.name.replace(client + "--", ""),
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
      return await this.completion(
        onUpdate,
        (this.options.call_tool_step || 100) > step + 1,
        step + 1,
      );
    } else {
      console.log("this.messages", this.messages);
      return content;
    }
  }
  clear() {
    this.messages = this.messages.filter((m) => m.role === "system");
    this.lastMessage = null;
    this.totalTokens = 0;
  }
}
