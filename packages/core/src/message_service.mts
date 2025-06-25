// import { activeUser, userSocketMap, genMainMsg } from "./websocket.mjs";

import { Logger } from "src/polyfills/polyfills.mjs";
import type { Server as SocketIO } from "socket.io";
const userSocketMap = new Map();
let activeUser: string | undefined = undefined;

/**
 * message_service.mts 负责后端消息推送与 Socket 通信：
 * - 管理主消息通道和终端消息通道
 * - 支持向前端渲染进程单发/群发消息
 * - 维护用户与 socketId 的映射，实现用户级推送
 * - 监听用户连接、断开、激活等事件
 */
export class MessageService {
  MainMsg!: SocketIO;
  genMainMsg = () => {
    return this.MainMsg;
  };
  terminalMsg!: SocketIO;
  // 发送消息到渲染进程
  async sendToRenderer(data: any, channel: string = "message-from-main") {
    const { genMainMsg } = this;
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
  // 群发消息到所有渲染进程
  async sendAllToRenderer(data: any, channel: string = "message-from-main") {
    const { genMainMsg } = this;
    if (!genMainMsg()) {
      return;
    }
    genMainMsg().emit(channel, data);
  }
  // 初始化消息服务，监听连接、激活、断开等事件
  init(MainMsg: SocketIO, terminalMsg: SocketIO) {
    this.MainMsg = MainMsg;
    this.MainMsg.on("connection", (socket) => {
      Logger.info("用户已连接,socket ID:", socket.id);
      // 用户登录时记录关系
      socket.on("active", (userId) => {
        userSocketMap.set(userId, socket.id);
        activeUser = userId;
      });
      socket.on("disconnect", () => {
        // 遍历删除断开连接的socket
        for (const [userId, socketId] of userSocketMap.entries()) {
          if (socketId === socket.id) {
            userSocketMap.delete(userId);
          }
        }
      });
    });
    this.terminalMsg = terminalMsg;
    this.terminalMsg.on("connection", (socket) => {
      Logger.info("terminalMsg 用户已连接,socket ID:", socket.id);
      socket.on("terminal-receive", (msg) => {
        // console.log("terminal-receive", msg);
        this.terminalCallbacks.forEach((callback) => {
          callback(msg);
        });
      });
    });
  }
  terminalCallbacks: Array<(msg: any) => void> = [];
  addTerminalMsgListener(callback: (msg: any) => void) {
    this.terminalCallbacks.push(callback);
  }
  removeTerminalMsgListener(callback: (msg: any) => void) {
    this.terminalCallbacks = this.terminalCallbacks.filter(cb => cb !== callback);
  }
}

let messageService: MessageService = new MessageService();

export const getMessageService = () => {
  return messageService;
};
