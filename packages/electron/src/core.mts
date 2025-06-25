// Re-export core modules with correct paths
export { Command } from "../../core/src/command.mjs";
export { ElectronCommand } from "./command.mjs";
export { Config } from "../../core/src/const.mjs";
export { initHttp } from "../../core/src/websocket.mjs";
export { getMessageService } from "../../core/src/message_service.mjs";

// Re-export first initialization (side effect)
import "../../core/src/first.mjs";
import "../../core/src/common/data.mjs";