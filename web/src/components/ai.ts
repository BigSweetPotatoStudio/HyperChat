import { z } from "zod";
import { GPT_MODELS, GPT_MODELS_TYPE } from "../../../common/data";
import { EVENT } from "../common/event";
import { MyMessage, OpenAiChannel } from "../common/openai";

import { zodResponseFormat, zodTextFormat } from 'openai/helpers/zod';


export async function getDefaultModelConfig() {
    // const BaseResponseSchema = z.object({ status: z.string() });
    // // Invalid JSON Schema for Structured Outputs
    // const json = zodResponseFormat(BaseResponseSchema, 'final_schema');
    // console.log(json);

    let config: GPT_MODELS_TYPE = undefined
    await GPT_MODELS.init();
    if (config == null) {
        config = GPT_MODELS.get().data.find(m => m.isDefault);
    }
    if (config == null) {
        if (GPT_MODELS.get().data.length == 0) {
            EVENT.fire("setIsModelConfigOpenTrue");
            throw new Error("Please add LLM first");
        }
        config = GPT_MODELS.get().data[0];
    }
    return config;
}

export function getDefaultModelConfigSync(models: typeof GPT_MODELS): GPT_MODELS_TYPE | undefined {
    let config: GPT_MODELS_TYPE | undefined = undefined;
    if (config == null) {
        config = models.get().data.find(m => m.isDefault);
    }
    if (config == null) {
        config = models.get().data[0];
    }
    return config;
}
export async function rename(messages: MyMessage[]) {
    let config = await getDefaultModelConfig();
    try {
        let openaiClient = new OpenAiChannel({
            ...config,
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
            supportTool: false,
            requestType: "complete",
        }, messages);
        let res = await openaiClient.completionParse(
            zodResponseFormat(z.object({
                name: z.string({
                    description: "Summarize this chat record"
                }),
            }), "test")
        )
        // console.log(res);
        return res.name;
    } catch (e) {
        return e.message;
    }
}

export async function genCronExpression(message: string) {
    let config = await getDefaultModelConfig();
    try {
        let openaiClient = new OpenAiChannel({
            ...config,
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
            supportTool: false,
            requestType: "complete",
        }, [{
            role: "system",
            content: "You are a cron expression generator. Please generate a cron expression for the following message.",
        }, {
            role: "user",
            content: message,
        }]);
        let res = await openaiClient.completionParse(
            zodResponseFormat(z.object({
                cron: z.string({
                    description: "This is a cron expression"
                }),
            }), "test")
        );
        // console.log(res);
        return res.cron;
    } catch (e) {
        return e.message;
    }
}