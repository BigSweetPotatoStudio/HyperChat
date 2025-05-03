import OpenAI from "openai";
import { OpenAICompatibility } from "../openai-compatibility";
import Anthropic from '@anthropic-ai/sdk';
import { max } from "lodash";

import { ContentBlock, ImageBlockParam, Message, MessageCreateParamsNonStreaming, RawMessageStreamEvent, TextBlock, TextBlockParam, ToolResultBlockParam, ToolUseBlock, ToolUseBlockParam } from "@anthropic-ai/sdk/resources";
import { HyperChatCompletionTool, MyMessage } from "../../../../common/data";




export class AnthropicProvider {
    client: Anthropic;
    constructor(public options) {
        this.client = new Anthropic(options);
    }

    stream: any = async function* (body: {
        messages: MyMessage[];
        model: string;
        temperature?: number;
        tools: HyperChatCompletionTool[];
        stream: true,
        stream_options: {
            include_usage: boolean,
        },
        max_tokens?: number,
        tool_choice: any,
    }, options: {
        signal: AbortSignal,
    }) {
        let { messages, systemMessage } = await convertMessages(body.messages);
        let tools = convertToolParams(body.tools).tools;
        let tool_choice = undefined
        if (body.tool_choice) {
            tool_choice = { "type": "tool", "name": body.tool_choice.function.name }

        }
        let res = await this.client.messages.stream({
            max_tokens: body.max_tokens || 4096,
            messages,
            model: body.model,
            temperature: body.temperature,
            system: systemMessage,
            tools,
            tool_choice,
        }, options);
        let message: any = null;
        let initialToolCallIndex: number | null = null;

        function formatEvent(chunk: RawMessageStreamEvent) {
            if (chunk.type === 'message_start') {
                message = chunk.message
                return {
                    choices: [
                        {
                            index: 0,
                            finish_reason: toFinishReasonStreaming(chunk.message.stop_reason),
                            delta: {
                                role: chunk.message.role,
                            },
                        },
                    ],
                    model: message.model,
                    id: message.id,
                    object: 'chat.completion.chunk',
                }
            }

            let newStopReason;

            let delta = {}
            if (chunk.type === 'content_block_start') {
                if (chunk.content_block.type === 'text') {
                    delta = {
                        content: chunk.content_block.text,
                    }
                } else {
                    if (initialToolCallIndex === null) {
                        initialToolCallIndex = chunk.index
                    }

                    delta = {
                        tool_calls: [
                            {
                                index: chunk.index - initialToolCallIndex,
                                id: (chunk.content_block as Anthropic.Messages.ToolUseBlock).id,
                                type: 'function',
                                function: {
                                    name: (chunk.content_block as Anthropic.Messages.ToolUseBlock).name,
                                    arguments: isEmptyObject((chunk.content_block as Anthropic.Messages.ToolUseBlock).input)
                                        ? ''
                                        : JSON.stringify((chunk.content_block as Anthropic.Messages.ToolUseBlock).input),
                                },
                            },
                        ],
                    }
                }
            } else if (chunk.type === 'content_block_delta') {
                if (chunk.delta.type === 'input_json_delta') {
                    if (initialToolCallIndex === null) {
                        // We assign the initial tool call index in the `content_block_start` event, which should
                        // always come before a `content_block_delta` event, so this variable should never be null.
                        throw new Error(
                            `Content block delta event came before a content block start event.`
                        )
                    }

                    delta = {
                        tool_calls: [
                            {
                                index: chunk.index - initialToolCallIndex,
                                function: {
                                    arguments: chunk.delta.partial_json,
                                },
                            },
                        ],
                    }
                } else {
                    delta = {
                        content: (chunk.delta as Anthropic.Messages.TextDelta).text,
                    }
                }
            } else if (chunk.type === 'message_delta') {
                newStopReason = chunk.delta.stop_reason
            }

            const stopReason =
                newStopReason !== undefined ? newStopReason : message?.stop_reason
            const finishReason = toFinishReasonStreaming(stopReason)

            const chunkChoice = {
                index: 0,
                finish_reason: finishReason,
                delta,
            }

            return {
                choices: [chunkChoice],
                // created,
                model: message?.model,
                id: message?.id,
                object: 'chat.completion.chunk',
                // Our SDK doesn't currently support OpenAI's `stream_options`, so we don't include a `usage`
                // field here.
            }

        }
        // 原写法
        for await (const chunk of res) {
            // 你可以在这里修改 chunk 内容
            yield formatEvent(chunk);
        }

    }
    async completion(body: {
        messages: MyMessage[];
        model: string;
        temperature?: number;
        tools: HyperChatCompletionTool[];
        stream: boolean,
        stream_options: {
            include_usage: boolean,
        },
        max_tokens?: number,
        tool_choice: any,
    }, options: {
        signal: AbortSignal,
    }) {

        if (body.stream) {
            return this.stream(body, options);
        } else {
            let { messages, systemMessage } = await convertMessages(body.messages);
            let tools = convertToolParams(body.tools).tools;
            const createCompletionResponseNonStreaming = (
                response,
                toolChoice
            ) => {
                const finishReason = toFinishReasonNonStreaming(response.stop_reason)
                const chatMessage = toChatCompletionChoiceMessage(
                    response.content,
                    response.role,
                    toolChoice
                )
                const choice = {
                    index: 0,
                    message: chatMessage,
                    finish_reason: finishReason,
                }
                const converted = {
                    id: response.id,
                    choices: [choice],
                    model: response.model,
                    object: 'chat.completion',
                    tool_choice: toolChoice,
                    usage: {
                        prompt_tokens: response.usage.input_tokens,
                        completion_tokens: response.usage.output_tokens,
                        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
                    },
                }

                return converted
            }
            let tool_choice = undefined
            if (body.tool_choice) {
                tool_choice = { "type": "tool", "name": body.tool_choice.function.name }

            }
            const response = await this.client.messages.create({
                max_tokens: body.max_tokens || 4096,
                messages,
                model: body.model,
                temperature: body.temperature,
                system: systemMessage,
                tools,
                tool_choice
            })
            return createCompletionResponseNonStreaming(
                response,
                undefined
            )
        }
    }
    // async test(body, options) {
    //     this.client.baseURL = options.baseURL;
    //     this.client.apiKey = options.apiKey;
    //     let res = await this.client.messages.stream({
    //         messages: [{ role: 'user', content: "Hello" }],
    //         model: 'claude-3-5-haiku-20241022',
    //         max_tokens: 1024,
    //     });
    //     for await (const chunk of res) {
    //         // 你可以在这里修改 chunk 内容
    //         // yield chunk;
    //     }
    // }
    parse = (body, options) => {
        return undefined as any;
    }
}


const toFinishReasonStreaming = (
    stopReason
) => {
    if (stopReason === null) {
        return null
    } else if (stopReason === 'end_turn' || stopReason === 'stop_sequence') {
        return 'stop'
    } else if (stopReason === 'max_tokens') {
        return 'length'
    } else if (stopReason === 'tool_use') {
        return 'tool_calls'
    } else {
        return 'unknown'
    }
}
const isEmptyObject = (variable: any): boolean => {
    return (
        variable &&
        typeof variable === 'object' &&
        variable.constructor === Object &&
        Object.keys(variable).length === 0
    )
}
const toChatCompletionChoiceMessage = (
    content: Message['content'],
    role: Message['role'],
    toolChoice
) => {
    const textBlocks = content.filter(isTextBlock)
    if (textBlocks.length > 1) {
        console.warn(
            `Received multiple text blocks from Anthropic, which is unexpected. Concatenating the text blocks into a single string.`
        )
    }

    let toolUseBlocks: Anthropic.Messages.ToolUseBlock[]
    if (typeof toolChoice !== 'string' && toolChoice?.type === 'function') {
        // When the user-defined tool_choice type is 'function', OpenAI always returns a single tool use
        // block, but Anthropic can return multiple tool use blocks. We select just one of these blocks
        // to conform to OpenAI's API.
        const selected = content
            .filter(isToolUseBlock)
            .find((block) => block.name === toolChoice.function.name)
        if (!selected) {
            throw new Error(
                `Did not receive a tool use block from Anthropic for the function: ${toolChoice.function.name}`
            )
        }
        toolUseBlocks = [selected as Anthropic.Messages.ToolUseBlock]
    } else {
        toolUseBlocks = content.filter(isToolUseBlock)
    }

    let toolCalls: Array<any> | undefined
    if (toolUseBlocks.length > 0) {
        toolCalls = toolUseBlocks.map((toolUse) => {
            return {
                id: toolUse.id,
                function: {
                    name: toolUse.name,
                    arguments: JSON.stringify(toolUse.input),
                },
                type: 'function',
            }
        })
    }
    if (textBlocks.length === 0) {
        // There can be zero text blocks if either of these scenarios happen:
        // - A stop sequence is immediately hit, in which case Anthropic's `content` array is empty. In this
        //   scenario, OpenAI returns an empty string `content` field.
        // - There's only tool call responses. In this scenario, OpenAI returns a `content` field of `null`.
        const messageContent = content.every(isToolUseBlock) ? null : ''
        return {
            role,
            refusal: null,
            content: messageContent,
            tool_calls: toolCalls,
        }
    } else {
        return {
            role,
            refusal: null,
            content: textBlocks.map((textBlock) => textBlock.text).join('\n'),
            tool_calls: toolCalls,
        }
    }
}

const isTextBlock = (contentBlock: ContentBlock): contentBlock is TextBlock => {
    return contentBlock.type === 'text'
}

const isToolUseBlock = (
    contentBlock: ContentBlock
): contentBlock is ToolUseBlock => {
    return contentBlock.type === 'tool_use'
}
const toFinishReasonNonStreaming = (
    stopReason: Message['stop_reason']
) => {
    if (stopReason === null) {
        // Anthropic's documentation says that the `stop_reason` will never be `null` for non-streaming
        // calls.
        throw new Error(
            `Detected a 'stop_reason' value of 'null' during a non-streaming call.`
        )
    }

    if (stopReason === 'end_turn' || stopReason === 'stop_sequence') {
        return 'stop'
    } else if (stopReason === 'max_tokens') {
        return 'length'
    } else if (stopReason === 'tool_use') {
        return 'tool_calls'
    } else {
        return 'unknown'
    }
}

const convertMessages = async (
    messages: MyMessage[],
): Promise<{
    messages: MessageCreateParamsNonStreaming['messages']
    systemMessage: string | undefined
}> => {
    const output: MessageCreateParamsNonStreaming['messages'] = []
    const clonedMessages = structuredClone(messages)

    // Pop the first element from the user-defined `messages` array if it begins with a 'system'
    // message. The returned element will be used for Anthropic's `system` parameter. We only pop the
    // system message if it's the first element in the array so that the order of the messages remains
    // unchanged.
    let systemMessage: string | undefined
    if (clonedMessages.length > 0 && clonedMessages[0].role === 'system') {
        systemMessage = convertMessageContentToString(clonedMessages[0].content)
        clonedMessages.shift()
    }

    // Anthropic requires that the first message in the array is from a 'user' role, so we inject a
    // placeholder user message if the array doesn't already begin with a message from a 'user' role.
    if (
        clonedMessages[0].role !== 'user' &&
        clonedMessages[0].role !== 'system'
    ) {
        clonedMessages.unshift({
            role: 'user',
            content: 'Empty',
        })
    }

    let previousRole: 'user' | 'assistant' = 'user'
    let currentParams: Array<
        TextBlockParam | ImageBlockParam | ToolUseBlockParam | ToolResultBlockParam
    > = []
    for (const message of clonedMessages) {
        // Anthropic doesn't support the `system` role in their `messages` array, so if the user
        // defines system messages, we replace it with the `user` role and prepend 'System: ' to its
        // content. We do this instead of putting every system message in Anthropic's `system` string
        // parameter so that the order of the user-defined `messages` remains the same, even when the
        // system messages are interspersed with messages from other roles.
        const newRole =
            message.role === 'user' ||
                message.role === 'system' ||
                message.role === 'tool'
                ? 'user'
                : 'assistant'

        if (previousRole !== newRole) {
            output.push({
                role: previousRole,
                content: currentParams,
            })
            currentParams = []
        }

        if (message.role === 'tool') {
            const toolResult: ToolResultBlockParam = {
                tool_use_id: message.tool_call_id,
                content: message.content,
                type: 'tool_result',
            }
            currentParams.push(toolResult)
        } else if (message.role === 'assistant') {
            if (typeof message.content === 'string') {
                currentParams.push({
                    text: message.content,
                    type: 'text',
                })
            }

            if (Array.isArray(message.tool_calls)) {
                const convertedContent: Array<ToolUseBlockParam> =
                    message.tool_calls.map((toolCall) => {
                        return {
                            id: toolCall.id,
                            input: JSON.parse(toolCall.function.arguments),
                            name: toolCall.function.name,
                            type: 'tool_use',
                        }
                    })
                currentParams.push(...convertedContent)
            }
        } else if (typeof message.content === 'string') {
            const text =
                message.role === 'system'
                    ? `System: ${message.content}`
                    : message.content
            currentParams.push({
                type: 'text',
                text,
            })
        } else if (Array.isArray(message.content)) {
            const convertedContent: Array<TextBlockParam | ImageBlockParam> =
                await Promise.all(
                    message.content.map(async (e) => {
                        if (e.type === 'text') {
                            const text =
                                message.role === 'system' ? `System: ${e.text}` : e.text
                            return {
                                type: 'text',
                                text,
                            } as TextBlockParam
                        } else {
                            const parsedImage = e.image_url.url
                            return {
                                type: 'image',
                                source: {
                                    data: parsedImage.content,
                                    media_type: parsedImage.mimeType,
                                    type: 'base64',
                                },
                            } as ImageBlockParam
                        }
                    })
                )
            currentParams.push(...convertedContent)
        }

        previousRole = newRole
    }

    if (currentParams.length > 0) {
        output.push({
            role: previousRole,
            content: currentParams,
        })
    }

    return { messages: output, systemMessage }
}

const convertMessageContentToString = (
    messageContent: OpenAI.Chat.Completions.ChatCompletionMessageParam['content']
): string => {
    if (!messageContent) {
        return ''
    }

    return (
        (typeof messageContent === 'string'
            ? messageContent
            : messageContent
                .map(
                    (m: OpenAI.Chat.Completions.ChatCompletionContentPartText) => m.text
                )
                .join('\n')) ?? ''
    )
}


const convertToolParams = (

    tools: HyperChatCompletionTool[] | undefined
): {
    tools: MessageCreateParamsNonStreaming['tools']
} => {
    if (!tools) {
        return { tools: [] }
    }
    const convertedTools: MessageCreateParamsNonStreaming['tools'] = tools.map(
        (tool) => {
            return {
                name: tool.function.name,
                description: tool.function.description,
                input_schema: { type: 'object', ...tool.function.parameters },
            }
        }
    )

    return { tools: convertedTools }
}