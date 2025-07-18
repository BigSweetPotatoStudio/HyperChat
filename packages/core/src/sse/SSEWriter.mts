/**
 * Server-Sent Events 写入器
 * 用于向客户端发送流式数据
 */
import { Response } from 'express';
import { Logger } from '../log.mjs';

export class SSEWriter {
  private closed = false;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    private response: Response,
    private chatKey: string
  ) {
    this.setupSSEHeaders();
    this.startHeartbeat();
  }

  private setupSSEHeaders() {
    this.response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送初始连接确认
    this.write({
      type: 'connected',
      data: { chatKey: this.chatKey }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.closed) {
        this.write({
          type: 'ping',
          data: { timestamp: Date.now() }
        });
      }
    }, 30000); // 30秒心跳
  }

  /**
   * 写入 SSE 事件
   */
  write(event: { type: string; data: any }) {
    if (this.closed) {
      Logger.warn('Attempted to write to closed SSE connection');
      return;
    }

    try {
      const sseData = `event: ${event.type}\n` +
                     `data: ${JSON.stringify({
                       chatKey: this.chatKey,
                       timestamp: Date.now(),
                       ...event.data
                     })}\n\n`;

      this.response.write(sseData);
    } catch (error) {
      Logger.error('Failed to write SSE data:', error);
      this.close();
    }
  }

  /**
   * 关闭 SSE 连接
   */
  close() {
    if (this.closed) return;

    this.closed = true;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    try {
      this.response.end();
    } catch (error) {
      Logger.error('Error closing SSE connection:', error);
    }
  }

  /**
   * 检查连接是否已关闭
   */
  isClosed(): boolean {
    return this.closed;
  }
}