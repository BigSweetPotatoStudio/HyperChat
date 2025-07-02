import { Logger } from "./polyfills/polyfills.mjs";
import type { Server as SocketIO, Socket } from "socket.io";

// 类型定义
interface MessageData {
  type: string;
  data?: any;
  timestamp?: number;
}

interface TerminalMessage {
  command?: string;
  output?: string;
  error?: string;
  [key: string]: any;
}

type TerminalCallback = (msg: TerminalMessage) => void;
type UserSocketMap = Map<string, string>;

// 用户Socket映射和活跃用户管理
const userSocketMap: UserSocketMap = new Map();
let activeUser: string | undefined = undefined;

/**
 * MessageService 负责后端消息推送与 Socket 通信
 * 
 * 功能特性：
 * - 管理主消息通道和终端消息通道
 * - 支持向前端渲染进程单发/群发消息
 * - 维护用户与 socketId 的映射，实现用户级推送
 * - 监听用户连接、断开、激活等事件
 * - 提供终端消息的回调机制
 */
export class MessageService {
  private mainSocket: SocketIO | null = null;
  private terminalSocket: SocketIO | null = null;
  private terminalCallbacks: Set<TerminalCallback> = new Set();
  private isInitialized = false;

  /**
   * 获取主消息Socket实例
   */
  private getMainSocket(): SocketIO | null {
    return this.mainSocket;
  }
  /**
   * 发送消息到当前活跃用户的渲染进程
   * @param data 消息数据
   * @param channel 消息通道，默认为 "message-from-main"
   */
  async sendToRenderer(data: MessageData, channel: string = "message-from-main"): Promise<void> {
    const mainSocket = this.getMainSocket();
    if (!mainSocket) {
      Logger.warn("Main socket not initialized, cannot send message to renderer");
      return;
    }

    try {
      const socketId = activeUser ? userSocketMap.get(activeUser) : null;
      const messageWithTimestamp = {
        ...data,
        timestamp: data.timestamp || Date.now()
      };

      if (socketId) {
        mainSocket.to(socketId).emit(channel, messageWithTimestamp);
        Logger.debug(`Message sent to user ${activeUser} via socket ${socketId}`);
      } else {
        mainSocket.emit(channel, messageWithTimestamp);
        Logger.debug(`Message broadcasted to all connected clients`);
      }
    } catch (error) {
      Logger.error("Failed to send message to renderer:", error);
    }
  }
  /**
   * 群发消息到所有渲染进程
   * @param data 消息数据
   * @param channel 消息通道，默认为 "message-from-main"
   */
  async sendAllToRenderer(data: MessageData, channel: string = "message-from-main"): Promise<void> {
    const mainSocket = this.getMainSocket();
    if (!mainSocket) {
      Logger.warn("Main socket not initialized, cannot broadcast message");
      return;
    }

    try {
      const messageWithTimestamp = {
        ...data,
        timestamp: data.timestamp || Date.now()
      };

      mainSocket.emit(channel, messageWithTimestamp);
      // Logger.debug(`Message broadcasted to all clients on channel: ${channel}`);
    } catch (error) {
      Logger.error("Failed to broadcast message to all renderers:", error);
    }
  }
  /**
   * 初始化消息服务，设置Socket监听器
   * @param mainSocket 主要的Socket.IO服务器实例
   * @param terminalSocket 终端消息的Socket.IO服务器实例
   */
  init(mainSocket: SocketIO, terminalSocket: SocketIO): void {
    if (this.isInitialized) {
      Logger.warn("MessageService already initialized");
      return;
    }

    this.mainSocket = mainSocket;
    this.terminalSocket = terminalSocket;

    this.setupMainSocketListeners();
    this.setupTerminalSocketListeners();

    this.isInitialized = true;
    Logger.info("MessageService initialized successfully");
  }

  /**
   * 设置主Socket监听器
   */
  private setupMainSocketListeners(): void {
    if (!this.mainSocket) return;

    this.mainSocket.on("connection", (socket: Socket) => {
      Logger.info(`Main socket connected: ${socket.id}`);

      // 监听用户激活事件
      socket.on("active", (userId: string) => {
        this.handleUserActive(userId, socket.id);
      });

      // 监听断开连接事件
      socket.on("disconnect", (reason: string) => {
        this.handleUserDisconnect(socket.id, reason);
      });

      // 监听错误事件
      socket.on("error", (error: Error) => {
        Logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * 设置终端Socket监听器
   */
  private setupTerminalSocketListeners(): void {
    if (!this.terminalSocket) return;

    this.terminalSocket.on("connection", (socket: Socket) => {
      Logger.info(`Terminal socket connected: ${socket.id}`);

      socket.on("terminal-receive", (msg: TerminalMessage) => {
        this.handleTerminalMessage(msg);
      });

      socket.on("error", (error: Error) => {
        Logger.error(`Terminal socket error for ${socket.id}:`, error);
      });
    });
  }
  /**
   * 处理用户激活事件
   */
  private handleUserActive(userId: string, socketId: string): void {
    const previousSocketId = userSocketMap.get(userId);
    if (previousSocketId && previousSocketId !== socketId) {
      Logger.info(`User ${userId} switched from socket ${previousSocketId} to ${socketId}`);
    }

    userSocketMap.set(userId, socketId);
    activeUser = userId;
    Logger.info(`User ${userId} activated with socket ${socketId}`);
  }

  /**
   * 处理用户断开连接事件
   */
  private handleUserDisconnect(socketId: string, reason: string): void {
    let disconnectedUserId: string | null = null;

    // 查找并删除断开连接的socket映射
    for (const [userId, userSocketId] of userSocketMap.entries()) {
      if (userSocketId === socketId) {
        userSocketMap.delete(userId);
        disconnectedUserId = userId;
        break;
      }
    }

    // 如果断开的是当前活跃用户，清除活跃用户状态
    if (disconnectedUserId === activeUser) {
      activeUser = undefined;
    }

    Logger.info(`Socket ${socketId} disconnected (reason: ${reason})${disconnectedUserId ? `, user: ${disconnectedUserId}` : ''}`);
  }

  /**
   * 处理终端消息
   */
  private handleTerminalMessage(msg: TerminalMessage): void {
    try {
      this.terminalCallbacks.forEach((callback) => {
        callback(msg);
      });
    } catch (error) {
      Logger.error("Error processing terminal message:", error);
    }
  }

  /**
   * 添加终端消息监听器
   * @param callback 回调函数
   */
  addTerminalMsgListener(callback: TerminalCallback): void {
    this.terminalCallbacks.add(callback);
    Logger.debug(`Terminal message listener added, total: ${this.terminalCallbacks.size}`);
  }

  /**
   * 移除终端消息监听器
   * @param callback 要移除的回调函数
   */
  removeTerminalMsgListener(callback: TerminalCallback): void {
    const removed = this.terminalCallbacks.delete(callback);
    if (removed) {
      Logger.debug(`Terminal message listener removed, remaining: ${this.terminalCallbacks.size}`);
    }
  }

  /**
   * 获取当前连接状态信息
   */
  getConnectionStatus() {
    return {
      isInitialized: this.isInitialized,
      activeUser,
      connectedUsers: Array.from(userSocketMap.keys()),
      totalConnections: userSocketMap.size,
      terminalListeners: this.terminalCallbacks.size
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    userSocketMap.clear();
    activeUser = undefined;
    this.terminalCallbacks.clear();
    this.mainSocket = null;
    this.terminalSocket = null;
    this.isInitialized = false;
    Logger.info("MessageService cleaned up");
  }
}

// 单例模式实现
let messageServiceInstance: MessageService | null = null;

/**
 * 获取MessageService单例实例
 * @returns MessageService实例
 */
export const getMessageService = (): MessageService => {
  if (!messageServiceInstance) {
    messageServiceInstance = new MessageService();
  }
  return messageServiceInstance;
};

/**
 * 重置MessageService单例（主要用于测试）
 */
export const resetMessageService = (): void => {
  if (messageServiceInstance) {
    messageServiceInstance.cleanup();
    messageServiceInstance = null;
  }
};
