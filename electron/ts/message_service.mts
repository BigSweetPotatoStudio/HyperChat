// import { activeUser, userSocketMap, genMainMsg } from "./websocket.mjs";

export class MessageService {
  activeUser;
  userSocketMap;
  MainMsg;
  genMainMsg = () => {
    return this.MainMsg as any;
  };

  // 发送消息到渲染进程
  async sendToRenderer(data: any, channel: string = "message-from-main") {
    const { genMainMsg, activeUser, userSocketMap } = this;
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
    const { genMainMsg } = this;
    if (!genMainMsg()) {
      return;
    }
    genMainMsg().emit(channel, data);
  }
  init(MainMsg, activeUser, userSocketMap) {
    this.MainMsg = MainMsg;
    this.activeUser = activeUser;
    this.userSocketMap = userSocketMap;
  }
}

let messageService: MessageService = new MessageService();

export const getMessageService = () => {
  return messageService;
};
