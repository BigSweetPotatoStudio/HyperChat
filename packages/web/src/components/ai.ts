import { z } from "zod";
import { AI_MODELS, AIModelConfigItem, MyMessage } from "@hyperchat/shared/data.mjs";
import { EVENT } from "../common/event";
import { AiChannel } from "@hyperchat/shared/ai.mjs";

import { zodResponseFormat, zodTextFormat } from 'openai/helpers/zod';


export async function getDefaultModelConfig() {
    // const BaseResponseSchema = z.object({ status: z.string() });
    // // Invalid JSON Schema for Structured Outputs
    // const json = zodResponseFormat(BaseResponseSchema, 'final_schema');
    // console.log(json);

    let config: AIModelConfigItem | undefined = undefined
    await AI_MODELS.init();
    if (config == null) {
        config = AI_MODELS.get().data.find(m => m.isDefault);
    }
    if (config == null) {
        if (AI_MODELS.get().data.length == 0) {
            EVENT.fire("setIsModelConfigOpenTrue");
            throw new Error("Please add LLM first");
        }
        config = AI_MODELS.get().data[0];
    }
    if (!config) {
        throw new Error("No model configuration available");
    }
    return config;
}

export function getDefaultModelConfigSync(models: typeof AI_MODELS): AIModelConfigItem | undefined {
    let config: AIModelConfigItem | undefined = undefined;
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
        let aiClient = new AiChannel({}, messages);
        aiClient.register({
            antdmessage: { warning: (msg) => console.warn(msg) },
            mcpTools: [],
            platform: "web",
            getURL_PRE: () => ""
        });
        let res = await aiClient.completionParse(
            zodResponseFormat(z.object({
                name: z.string({
                    description: "Summarize this chat record"
                }),
            }), "test")
        )
        // console.log(res);
        return res?.name || "Untitled";
    } catch (e: any) {
        return e?.message || "Error generating name";
    }
}

export async function genCronExpression(message: string) {
    let config = await getDefaultModelConfig();
    try {
        let aiClient = new AiChannel({}, [{
            role: "system",
            content: "You are a cron expression generator. Please generate a cron expression for the following message.",
            content_status: "success",
            content_attachment: [],
            content_date: Date.now(),
        }, {
            role: "user",
            content: message,
            content_status: "success",
            content_attachment: [],
            content_date: Date.now(),
        }]);
        aiClient.register({
            antdmessage: { warning: (msg) => console.warn(msg) },
            mcpTools: [],
            platform: "web",
            getURL_PRE: () => ""
        });
        let res = await aiClient.completionParse(
            zodResponseFormat(z.object({
                cron: z.string({
                    description: "This is a cron expression"
                }),
            }), "test")
        );
        // console.log(res);
        return res?.cron || "0 0 * * *";
    } catch (e: any) {
        return e?.message || "Error generating cron expression";
    }
}