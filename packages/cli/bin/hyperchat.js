#!/usr/bin/env node

/**
 * HyperChat CLI 可执行入口
 * 
 * 这个文件会被安装到系统的 PATH 中，
 * 用户可以通过 hyperchat 或 hc 命令来调用
 */

import('../dist/index.js').catch(error => {
  console.error('启动 HyperChat CLI 失败:', error);
  process.exit(1);
});