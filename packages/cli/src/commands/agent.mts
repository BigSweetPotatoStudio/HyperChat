/**
 * Agent 命令实现
 */

import { Logger } from '../utils/logger.mjs';

export async function listAgents() {
  const logger = new Logger();
  logger.info('🤖 代理列表功能开发中...');
}

export async function createAgent(name: string) {
  const logger = new Logger();
  logger.info(`🤖 创建代理: ${name} (功能开发中...)`);
}