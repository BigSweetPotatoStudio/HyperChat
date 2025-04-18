
import OpenAI from "openai";
import type { ClientOptions } from "openai";
import { Completions as BetaCompletions } from "openai/resources/beta/chat/completions";
import { AnthropicProvider } from "./ai_provider/anthropic";
import { MyMessage } from "./openai";
import { Completions } from "openai/resources/chat/completions";
import { HyperChatCompletionTool } from "../../../common/data";
import { message } from "antd";

export class OpenAICompatibility {
    openai: OpenAI;
    anthropic: AnthropicProvider;
    baseURL: string;
    apiKey: string;
    provider: string;

    constructor(public options: ClientOptions) {
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
        if (this.provider === "anthropic") {
            this.anthropic.client.baseURL = this.baseURL;
            this.anthropic.client.apiKey = this.apiKey;
            return this.anthropic.completion(body, options) as any;
        } else {
            this.openai.baseURL = this.baseURL;
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
        if (this.provider === "anthropic"  || this.provider == "anthropic-openai") {
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
            if(!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
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
        } else {
            return await this.openai.beta.chat.completions.parse(body, options) as any;
        }
    }) as any;;
}