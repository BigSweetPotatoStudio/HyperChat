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

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
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