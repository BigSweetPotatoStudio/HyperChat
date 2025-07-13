import { z } from "zod";
import { MyMessage } from "@dadigua/hyperchat-shared/types";
import { AIModelConfigItem } from "@dadigua/hyperchat-shared";
import { EVENT } from "./event";
import { AiChannel } from "@dadigua/hyperchat-shared/ai";

import { zodResponseFormat, zodTextFormat } from 'openai/helpers/zod';
import { AISettings } from "@dadigua/hyperchat-shared";



export async function rename(modelKey: string, aiSettings: AISettings) {

    try {
        let aiClient = new AiChannel({});
        
        // 确保aiSettings符合AISettings类型的要求
        const normalizedAiSettings = {
            models: (aiSettings?.models || []).filter(model => 
                model.type && model.model && model.key && model.name && model.provider &&
                model.apiKey !== undefined && model.baseURL !== undefined
            ),
            customProviders: (aiSettings?.customProviders || []).filter(provider =>
                provider.key && provider.label && provider.baseURL !== undefined &&
                provider.hasApiKey !== undefined && provider.isBuiltIn !== undefined
            ),
            builtinApiKeys: Object.fromEntries(
                Object.entries(aiSettings?.builtinApiKeys || {}).filter(([_, value]) =>
                    value && value.apiKey !== undefined && value.baseURL !== undefined
                ).map(([key, value]) => [key, { apiKey: value!.apiKey!, baseURL: value!.baseURL! }])
            ),
            defaultModel: aiSettings?.defaultModel
        };
        
        aiClient.register({
            antdmessage: { warning: (msg) => console.warn(msg) },
            mcpTools: [],
            platform: "web",
            getURL_PRE: () => "",
            aiSettings: normalizedAiSettings as any
        });
        let res = await aiClient.completionParse(
            { modelKey },
            z.object({
                name: z.string({
                    description: "Summarize this chat, and generate a name for it.",
                }),
            }) as any, // 明确断言为 any，避免类型递归
            "You are a chat record summarizer. Please summarize the chat record and generate a name for it."
        );
        // console.log(res);
        return res?.name || "Untitled";
    } catch (e: any) {
        return e?.message || "Error generating name";
    }
}

// export async function genCronExpression(message: string) {
//     let config = await getDefaultModelConfig();
//     try {
//         let aiClient = new AiChannel({}, [{
//             role: "system",
//             content: "You are a cron expression generator. Please generate a cron expression for the following message.",
//             content_status: "success",
//             content_attachment: [],
//             content_date: Date.now(),
//         }, {
//             role: "user",
//             content: message,
//             content_status: "success",
//             content_attachment: [],
//             content_date: Date.now(),
//         }]);
//         aiClient.register({
//             antdmessage: { warning: (msg) => console.warn(msg) },
//             mcpTools: [],
//             platform: "web",
//             getURL_PRE: () => ""
//         });
//         let res = await aiClient.completionParse(
//             zodResponseFormat(z.object({
//                 cron: z.string({
//                     description: "This is a cron expression"
//                 }),
//             }), "test") as any // zodTextFormat(z.string(), "test") as any
//         );
//         // console.log(res);
//         return res?.cron || "0 0 * * *";
//     } catch (e: any) {
//         return e?.message || "Error generating cron expression";
//     }
// }