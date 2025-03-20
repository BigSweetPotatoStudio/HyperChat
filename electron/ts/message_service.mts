// import { activeUser, userSocketMap } from "./websocket.mjs";

export class MessageService {
  // private mainWindow;

  constructor() {
    // this.mainWindow = genMainMsg();
  }

  // 发送消息到渲染进程
  async sendToRenderer(data: any, channel: string = "message-from-main") {
    const { genMainMsg, activeUser, userSocketMap } = await import(
      "./websocket.mjs"
    );
    if (!genMainMsg()) {
      return;
    }
    const socketId = userSocketMap.get(activeUser);
    if (socketId) {
      genMainMsg().to(socketId).emit(channel, data);
    } else {
      genMainMsg().emit(channel, data);
    }
  }
  async sendAllToRenderer(data: any, channel: string = "message-from-main") {
    const { genMainMsg } = await import("./websocket.mjs");
    if (!genMainMsg()) {
      return;
    }
    genMainMsg().emit(channel, data);
  }
  // 初始化IPC监听器
  // async init() {
  //   const { genMainMsg } = await import("./websocket.mjs");
  //   this.mainWindow = genMainMsg();
  // }
}

let messageService: MessageService = new MessageService();

export const getMessageService = () => {
  return messageService;
};
