import { AgentData } from "../../../common/data";
import { OpenAiChannel } from "./openai";

export class Agent {
    artifacts: any[] = [];
    subAgents: Agent[] = [];

    constructor(private agentData: AgentData, private channel: OpenAiChannel, private inputs: { [key: string]: any; } = {}) {

    }
    receiveMessage(message: string) {
        console.log("Received message:", message);
    }
}