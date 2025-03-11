// import { activeUser, userSocketMap } from "./websocket.mjs";

export class MessageService {
  private mainWindow;

  constructor() {
    // this.mainWindow = genMainMsg();
  }

  // 发送消息到渲染进程
  async sendToRenderer(data: any, channel: string = "message-from-main") {
    if (!this.mainWindow) {
      return;
    }
    const { activeUser, userSocketMap } = await import("./websocket.mjs");
    const socketId = userSocketMap.get(activeUser);
    if (socketId) {
      this.mainWindow.to(socketId).emit(channel, data);
    } else {
      this.mainWindow.emit(channel, data);
    }
  }
  async sendAllToRenderer(data: any, channel: string = "message-from-main") {
    if (!this.mainWindow) {
      return;
    }
    this.mainWindow.emit(channel, data);
  }
  // 初始化IPC监听器
  async init() {
    const { genMainMsg } = await import("./websocket.mjs");
    this.mainWindow = genMainMsg();
    // 处理渲染进程的响应
    // ipcMain.on("renderer-response", (event, data) => {
    //   console.log("Received from renderer:", data);
    // });
  }
}

let messageService: MessageService = new MessageService();

messageService.init();

export const getMessageService = () => {
  return messageService;
};
