// Re-export core modules with correct paths
export { Command } from "../../core/ts/command.mjs";
export { ElectronCommand } from "./command.mjs";
export { Config } from "../../core/ts/const.mjs";
export { initHttp } from "../../core/ts/websocket.mjs";
export { getMessageService } from "../../core/ts/message_service.mjs";

// Re-export first initialization (side effect)
import "../../core/ts/first.mjs";
import "../../core/ts/common/data.mjs";