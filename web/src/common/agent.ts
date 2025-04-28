import { AgentData, MyMessage, GPT_MODELS_TYPE, VarList, GPT_MODELS } from "../../../common/data";
import { getDefaultModelConfigSync } from "../components/ai";
import { OpenAiChannel } from "./openai";
import _ from 'lodash';

export class Agent {
    artifacts: any[] = [];
    subAgents: Agent[] = [];
    channel: OpenAiChannel;
    gptModelData: GPT_MODELS_TYPE;
    constructor(public agentData: AgentData, public inputs: { [key: string]: any; } = {}) {

    }
    async init(modelKey?: string) {
        await GPT_MODELS.init();
        modelKey = modelKey || this.agentData.modelKey;
        let gptModelData = GPT_MODELS.get().data.find((x) => x.key == modelKey) || getDefaultModelConfigSync(GPT_MODELS);

        if (!gptModelData) {
            throw new Error("Please add LLM first");
        }
        this.gptModelData = gptModelData;
        this.channel = new OpenAiChannel({
            ...gptModelData,
            ...this.agentData,
            requestType: "stream",
            messages_format_callback: async (message) => {
                await VarList.init();
                if (message.role == "user" || message.role == "system") {
                    if (!message.content_sended) {
                        let varList = [...VarList.get().data?.map((v) => {
                            let varName = v.scope + "." + v.name;
                            return {
                                ...v,
                                varName: varName,
                            }
                        })];
                        async function renderTemplate(template: string) {
                            let reg = /{{(.*?)}}/g;
                            let matchs = template.match(reg);
                            let subResults = [];
                            for (let match of matchs || []) {
                                let varName = match.slice(2, -2).trim();
                                let v = varList.find((x) => x.varName == varName);
                                let value = varName;
                                if (v) {
                                    if (v.variableType == "js") {
                                        value = await globalThis.ext2.call("runCode", [{ code: v.code }]).catch(e => {
                                            throw new Error(`${varName} var runCode Error:\n${e.message}`);
                                        });
                                    } else if (v.variableType == "webjs") {
                                        if (process.env.runtime == "node") {
                                            value = await globalThis.ext2.call("runCode", [{ code: v.code }]).catch(e => {
                                                throw new Error(`${varName} var runCode Error: task is running in the nodejs environment, does not support webjs.\n${e.message}`);
                                            });
                                        } else {
                                            let code = `
                                            (async () => {
                                                ${v.code}
                                            return await get()
                                            })()
                                            `;
                                            value = await eval(code);
                                        }
                                    } else {
                                        value = v.value;
                                    }
                                }
                                subResults.push({ value, varName });
                            }
                            let result = template.replace(reg, (match, p1) => {
                                return subResults.find((x) => x.varName === p1.trim())?.value || match;
                            });
                            return result;
                        }
                        if (message.content_template) {
                            if (typeof message.content == "string") {
                                message.content = await renderTemplate(message.content_template);
                            }
                            else if (Array.isArray(message.content) && message.content.length >= 1) {
                                if (message.content[0].type == "text") {
                                    message.content[0].text = await renderTemplate(message.content_template);
                                }
                            }

                        }
                        message.content_sended = true;
                    }
                }
            },
        }, [
            {
                role: "system",
                content_template: this.agentData.prompt,
                content: "",
                content_date: Date.now(),
            },
        ]);
    }
    async receiveMessage(message: MyMessage) {
        this.channel.addMessage(message);
        let index = this.channel.messages.length;
        await this.channel.completion();
        // let result = this.channel.getRelay(index);
        let lastMessage = _.cloneDeep(this.channel.lastMessage);
        // console.log("result", result);
        // lastMessage.content = result;
        return lastMessage;
    }
}