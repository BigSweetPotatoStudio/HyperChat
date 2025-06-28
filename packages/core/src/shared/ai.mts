
import OpenAI from "openai";
import type { ClientOptions } from "openai";
import { Completions as BetaCompletions } from "openai/resources/beta/chat/completions";
import { AnthropicProvider } from "./ai_provider/anthropic";
import { MyMessage } from "./data.mjs";
import { Completions } from "openai/resources/chat/completions";
import { electronData, GPT_MODELS_TYPE, HyperChatCompletionTool } from "./data.mjs";
import { genSystemPrompt } from "./prompt";

/**
 * Defines the structure for the call module, which provides environment-specific utilities.
 */
interface CallModule {
  getURL_PRE: () => string;
  getWebSocket: () => WebSocket | null;
}

let callModule: CallModule = {
  getURL_PRE: () => "",
  getWebSocket: () => null,
};

// Dynamically import the 'call' module based on the runtime environment.
// This ensures that browser-specific APIs are only loaded in the browser.
if (process.env.runtime !== "node") {
  import("./call").then((call) => {
    callModule.getURL_PRE = call.getURL_PRE;
    callModule.getWebSocket = call.getWebSocket;
  });
}

/**
 * A compatibility layer for OpenAI and Anthropic API interactions.
 * This class customizes the fetch behavior and handles tool compatibility
 * for different language model providers.
 */
export class OpenAICompatibility {
  openai: OpenAI;
  anthropic: AnthropicProvider;

  /**
   * Constructs an instance of OpenAICompatibility.
   * @param {ClientOptions} options - Options for the OpenAI client, including API key and base URL.
   * @param {Partial<GPT_MODELS_TYPE>} modelData - Partial model configuration data, including provider and tool mode.
   */
  constructor(public options: ClientOptions, public modelData: Partial<GPT_MODELS_TYPE>) {
    // Override the default fetch behavior to handle proxying and error responses.
    options.fetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
      // If in a browser environment and server proxy is enabled, modify headers for proxying.
      if (process.env.runtime !== "node" && electronData.get().browserNetworkSetting === "server-proxy") {
        init = {
          ...init,
          headers: {
            ...(init?.headers || {}),
            baseURL: encodeURIComponent(this.modelData.baseURL || ""), // Encode base URL for proxy
          },
        };
      }

      const response = await fetch(url, init);

      // Handle specific error responses, e.g., Gemini OpenAI prompt errors.
      if (response.status === 400) {
        const json = await response.clone().json();
        if (Array.isArray(json)) {
          let errorMessage = "";
          for (const r of json) {
            errorMessage += r.error.message + "\n";
          }
          return new Response(JSON.stringify({ error: { message: errorMessage } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      return response;
    };

    this.openai = new OpenAI(options);
    this.anthropic = new AnthropicProvider({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
      dangerouslyAllowBrowser: process.env.runtime !== "node", // Allow browser usage if not in Node.js
      fetch: options.fetch,
    });
  }

  /**
   * Gets the base URL for API requests, considering proxy settings.
   * @returns {string} The base URL.
   */
  get baseURL(): string {
    if (process.env.runtime !== "node" && electronData.get().browserNetworkSetting === "server-proxy") {
      return callModule.getURL_PRE() + "api/ai";
    } else {
      return this.modelData.baseURL || "";
    }
  }

  /**
   * Creates a chat completion request.
   * This method handles compatibility for different providers (Anthropic, Qwen) and tool modes.
   * @param {object} body - The request body for chat completion.
   * @param {MyMessage[]} body.messages - The list of messages in the conversation.
   * @param {string} body.model - The model to use for completion.
   * @param {number} [body.temperature] - The sampling temperature.
   * @param {HyperChatCompletionTool[]} body.tools - The tools available for the model.
   * @param {any} body.tool_choice - The tool choice strategy.
   * @param {boolean} body.stream - Whether to stream the response.
   * @param {object} body.stream_options - Options for streaming.
   * @param {boolean} body.stream_options.include_usage - Whether to include usage information in stream.
   * @param {number} [body.max_tokens] - The maximum number of tokens to generate.
   * @param {RequestInit} [options] - Additional request options.
   * @returns {Promise<any>} A promise that resolves with the completion response.
   */
  completion: Completions["create"] = (async (body: {
    messages: MyMessage[];
    model: string;
    temperature?: number;
    tools?: HyperChatCompletionTool[];
    tool_choice?: any;
    stream: boolean;
    stream_options?: {
      include_usage: boolean;
    };
    max_tokens?: number;
  }, options?: RequestInit) => {
    // Qwen specific handling for thinking mode.
    if (this.modelData.provider === "qwen") {
      if (!body.stream) {
        (body as any)["enable_thinking"] = false;
      }
    }

    // Anthropic provider specific completion.
    if (this.modelData.provider === "anthropic") {
      this.anthropic.client.baseURL = this.baseURL;
      this.anthropic.client.apiKey = this.modelData.apiKey;
      return this.anthropic.completion(body, options);
    } else {
      // Handle tool compatibility for other providers.
      if (this.modelData.toolMode === "compatible") {
        let system = body.messages.find(x => x.role === "system");
        let systemPrompt = system?.content?.toString() || "";
        let systemNew = genSystemPrompt(systemPrompt, body.tools || []);

        // Update or add system message with generated prompt.
        if (system) {
          system.content = systemNew;
        } else {
          body.messages.unshift({
            role: "system",
            content: systemNew,
          });
        }
        delete body.tools; // Remove tools as they are integrated into the system prompt.

        // Transform tool messages into user messages for compatibility.
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
            };
          } else if (x.role === "assistant") {
            delete x.tool_calls; // Remove tool calls from assistant messages if not directly supported.
            return x;
          } else {
            return x;
          }
        });
      }

      // Set OpenAI client base URL and API key.
      this.openai.baseURL = this.baseURL;
      this.openai.apiKey = this.modelData.apiKey;

      return this.openai.chat.completions.create(body, options);
    }
  }) as Completions["create"];

  /**
   * Parses a chat completion response, specifically for JSON output.
   * This method handles compatibility for different providers and falls back to tool calls if direct parsing fails.
   * @param {object} body - The request body for parsing.
   * @param {MyMessage[]} body.messages - The list of messages.
   * @param {string} body.model - The model to use.
   * @param {number} body.temperature - The sampling temperature.
   * @param {any} body.response_format - The desired response format (e.g., JSON schema).
   * @param {RequestInit} [options] - Additional request options.
   * @returns {Promise<any>} A promise that resolves with the parsed response.
   */
  parse: BetaCompletions["parse"] = (async (body: {
    messages: MyMessage[];
    model: string;
    temperature: number;
    response_format: any;
  }, options?: RequestInit) => {

    // Helper function to get JSON using tool calls.
    const get_json = async () => {
      const tool: HyperChatCompletionTool = {
        type: 'function',
        function: {
          name: 'get_json',
          description: 'Give me a json object',
          parameters: body.response_format.json_schema.schema,
        }
      };
      const response = await this.completion({
        ...body,
        tools: [tool],
        tool_choice: { type: "function", function: { name: "get_json" } }
      }, options);

      const choice = response.choices[0];
      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        throw new Error("No tool call found");
      }
      const tool_call = choice.message.tool_calls[0];
      return {
        choices: [{
          message: {
            parsed: JSON.parse(tool_call.function.arguments)
          }
        }]
      };
    };

    // Use tool calls for Anthropic providers or fallback if direct parsing fails.
    if (this.modelData.provider === "anthropic" || this.modelData.provider === "anthropic-openai") {
      return await get_json();
    } else {
      this.openai.baseURL = this.baseURL;
      this.openai.apiKey = this.modelData.apiKey;

      return await this.openai.beta.chat.completions.parse(body, options).catch(async (e) => {
        try {
          return await get_json(); // Attempt to use tool calls as a fallback.
        } catch (fallbackError) {
          // If fallback also fails, re-throw the original error.
          throw e;
        }
      });
    }
  }) as BetaCompletions["parse"];

  /**
   * Lists available models.
   * @returns {Promise<any>} A promise that resolves with a list of models.
   */
  listModels: Completions["list"] = (() => {
    if (this.modelData.provider === "anthropic") {
      this.anthropic.client.baseURL = this.baseURL;
      this.anthropic.client.apiKey = this.modelData.apiKey;
      return this.anthropic.client.models.list();
    } else {
      this.openai.baseURL = this.baseURL;
      this.openai.apiKey = this.modelData.apiKey;
      return this.openai.models.list();
    }
  }) as Completions["list"];
}