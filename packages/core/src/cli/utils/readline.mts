/**
 * Readline 工具模块
 * 
 * 提供命令行输入/输出功能
 */

import process from 'process';
import * as readline from 'readline';

export interface ReadlineInterface {
  question(prompt: string): Promise<string>;
  close(): void;
}

export function createReadline(): ReadlineInterface {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  // 添加错误处理
  let isClosed = false;
  
  rl.on('close', () => {
    isClosed = true;
  });

  rl.on('SIGINT', () => {
    isClosed = true;
    rl.close();
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 检查是否已经关闭
      if (isClosed) {
        reject(new Error('Readline interface is closed'));
        return;
      }

      try {
        rl.question(prompt, resolve);
      } catch (error) {
        reject(error);
      }
    });
  };

  const close = () => {
    rl.close();
  };

  return {
    question,
    close
  };
}