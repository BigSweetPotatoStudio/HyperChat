
import OpenAI from "openai";
import type { ClientOptions } from "openai";
import { Completions as BetaCompletions } from "openai/resources/beta/chat/completions";
import { AnthropicProvider } from "./ai_provider/anthropic";
import { MyMessage } from "./openai";
import { Completions } from "openai/resources/chat/completions";
import { GPT_MODELS_TYPE, HyperChatCompletionTool } from "../../../common/data";
import { message } from "antd";
import { isOnBrowser } from "./const";
import { genSystemPrompt } from "./ai/prompt";
let callModule = {
    getURL_PRE: () => "",
    getWebSocket: () => null,
};
if (process.env.runtime === "node") {

} else {
    let call = await import("./call");
    callModule.getURL_PRE = call.getURL_PRE;
    callModule.getWebSocket = call.getWebSocket;
}
export class OpenAICompatibility {
    openai: OpenAI;
    anthropic: AnthropicProvider;
    baseURL: string;
    apiKey: string;

    constructor(public options: ClientOptions, public modelData: Partial<GPT_MODELS_TYPE>) {
        this.baseURL = options.baseURL;
        this.apiKey = options.apiKey;
        this.openai = new OpenAI(options);
        this.anthropic = new AnthropicProvider({
            apiKey: options.apiKey,
            baseURL: options.baseURL,
            dangerouslyAllowBrowser: process.env.runtime !== "node",
        });
    }

    completion: Completions["create"] = ((body: {
        messages: MyMessage[];
        model: string;
        temperature?: number;
        tools: HyperChatCompletionTool[];
        tool_choice: any,
        stream: boolean,
        stream_options: {
            include_usage: boolean,
        },
        max_tokens?: number,
    }, options?) => {


        if (this.modelData.provider === "anthropic") {
            this.anthropic.client.baseURL = process.env.runtime === "node"
                ? this.baseURL :
                isOnBrowser
                    ? (callModule.getURL_PRE() + "api/ai" + `?baseURL=${encodeURIComponent(this.baseURL)}`)
                    : this.baseURL;
            this.anthropic.client.apiKey = this.apiKey;
            return this.anthropic.completion(body, options) as any;
        } else {
            // this.modelData.toolMode = "compatible";

            if (this.modelData.toolMode === "compatible") {
                let system = body.messages.find(x => x.role === "system");
                let systemPrompt = system?.content?.toString() || ""
                let systemNew = genSystemPrompt(systemPrompt, body.tools);
                if (system) {
                    system.content = systemNew;
                } else {
                    body.messages.unshift({
                        role: "system",
                        content: systemNew,
                    });
                }
                delete body.tools;

                body.messages = body.messages.map((x) => {
                    if (x.role === "tool") {
                        return {
                            role: "user",
                            content: [{
                                type: "text",
                                text: `${x.tool_call_id} Tool use Result:`,
                            }, {
                                type: "text",
                                text: x.content,
                            }],
                        } as any;
                    } else {
                        return x;
                    }
                })
            }


            this.openai.baseURL = process.env.runtime === "node"
                ? this.baseURL :
                isOnBrowser
                    ? (callModule.getURL_PRE() + "api/ai" + `?baseURL=${encodeURIComponent(this.baseURL)}`)
                    : this.baseURL;
            this.openai.apiKey = this.apiKey;

            return this.openai.chat.completions.create(body, options) as any;
        }
    }) as any;

    parse: BetaCompletions["parse"] = (async (body: {
        messages: MyMessage[],
        model: string,
        temperature: number,
        response_format: any,
    }, options?: any) => {

        let get_json = async () => {
            let tool = {
                type: 'function' as const,
                function: {
                    name: 'get_json',
                    description: 'Give me a json object',
                    parameters: body.response_format.json_schema.schema,
                }
            }
            let response = await this.completion({
                ...body,
                tools: [tool],
                tool_choice: { type: "function", function: { name: "get_json" } }
            }, options);
            // console.log(response);
            let choice = response.choices[0];
            if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
                throw new Error("No tool call found");
            }
            let tool_call = choice.message.tool_calls[0];
            return {
                choices: [{
                    message: {
                        parsed: JSON.parse(tool_call.function.arguments)
                    }
                }]
            };
        }

        if (this.modelData.provider === "anthropic" || this.modelData.provider == "anthropic-openai") {
            return await get_json();
        } else {
            this.openai.baseURL = process.env.runtime === "node"
                ? this.baseURL :
                isOnBrowser
                    ? (callModule.getURL_PRE() + "api/ai" + `?baseURL=${encodeURIComponent(this.baseURL)}`)
                    : this.baseURL;
            this.openai.apiKey = this.apiKey;

            return await this.openai.beta.chat.completions.parse(body, options).catch(async (e) => {
                try {
                    return await get_json();
                } catch { }
                throw e;
            });
        }
    }) as any;;
}