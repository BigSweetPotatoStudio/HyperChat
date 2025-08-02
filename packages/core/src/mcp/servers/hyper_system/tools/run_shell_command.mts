import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  normalizePath,
  validateCommand
} from '../utils.mjs';
import { HyperSystemToolError, ERROR_CODES, createToolSchema } from '../lib.mjs';

const runShellCommandSchema = createToolSchema({
  command: z.string().describe('The shell command to execute'),
  working_directory: z.string().optional().describe('Working directory for the command. This parameter is required.'),
  timeout: z.number().int().min(1000).max(300000).default(30000).describe('Command timeout in milliseconds (1s to 5min)'),
});

interface CommandResult {
  success: boolean;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  command: string;
  workingDirectory: string;
  duration: number;
  timedOut: boolean;
  error: Error | null;
  backgroundPIDs: number[];
  processGroupPID: number | null;
}

/**
 * 获取命令的根命令名（用于权限检查）
 */
function getCommandRoot(command: string): string | undefined {
  return command
    .trim()
    .replace(/[{}()]/g, '') // 移除分组操作符
    .split(/[\s;&|]+/)[0]   // 按空格或分隔符分割，取第一部分
    ?.split(/[/\\]/)        // 按路径分隔符分割
    .pop();                 // 取最后部分作为命令根
}

/**
 * 检查命令是否允许执行（基础安全检查）
 */
function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  // 禁止命令替换
  if (command.includes('$(')) {
    return {
      allowed: false,
      reason: 'Command substitution using $() is not allowed for security reasons',
    };
  }

  // 使用正则表达式精确匹配危险命令模式
  const dangerousPatterns = [
    /^\s*rm\s+-rf\s+\/\s*$/i,                    // rm -rf /
    /^\s*mkfs\s/i,                               // mkfs 开头的命令
    /^\s*dd\s+if=/i,                             // dd if= 开头的命令
    /^\s*format\s+[a-z]:\s*/i,                   // format C: / format D: 等
    /^\s*:\(\)\{\s*:\|\s*:\s*&\s*\}\s*;\s*:\s*$/i, // fork bomb
    /^\s*sudo\s+rm\s+-rf\s+\/\s*$/i,            // sudo rm -rf /
  ];

  const normalizedCommand = command.trim();

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalizedCommand)) {
      return {
        allowed: false,
        reason: `Dangerous command pattern detected: ${pattern.source}`,
      };
    }
  }

  return { allowed: true };
}

async function executeCommand(
  command: string,
  workingDirectory: string,
  timeout: number,
  abortSignal?: AbortSignal
): Promise<CommandResult> {
  const startTime = Date.now();

  // 检查是否已经被取消
  if (abortSignal?.aborted) {
    return {
      success: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: 'Command was cancelled before it could start',
      command,
      workingDirectory,
      duration: 0,
      timedOut: false,
      error: new Error('Command was cancelled before it could start'),
      backgroundPIDs: [],
      processGroupPID: null,
    };
  }

  // 安全检查
  const commandCheck = isCommandAllowed(command);
  if (!commandCheck.allowed) {
    return {
      success: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: commandCheck.reason || 'Command not allowed',
      command,
      workingDirectory,
      duration: 0,
      timedOut: false,
      error: new Error(commandCheck.reason || 'Command not allowed'),
      backgroundPIDs: [],
      processGroupPID: null,
    };
  }

  return new Promise((resolve) => {
    const isWindows = os.platform() === 'win32';

    // 创建临时文件用于跟踪后台进程（仅 Unix 系统）
    const tempFileName = `shell_pgrep_${crypto.randomBytes(6).toString('hex')}.tmp`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    // 为 Unix 系统包装命令以跟踪进程组
    let wrappedCommand = command;
    if (!isWindows) {
      let cmd = command.trim();
      if (!cmd.endsWith('&')) cmd += ';';
      wrappedCommand = `{ ${cmd} }; __code=$?; pgrep -g 0 >${tempFilePath} 2>&1; exit $__code;`;
    }

    const shell = isWindows ? 'cmd' : 'bash';
    const args = isWindows ? ['/c', wrappedCommand] : ['-c', wrappedCommand];

    const childProcess = spawn(shell, args, {
      cwd: workingDirectory,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: !isWindows, // Unix 系统创建进程组
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let cancelled = false;
    let error: Error | null = null;
    let exitCode: number | null = null;
    let signal: string | null = null;

    // 终止进程的通用函数
    const killProcess = () => {
      if (isWindows) {
        // Windows: 使用 taskkill 终止进程树
        if (childProcess.pid) {
          spawn('taskkill', ['/pid', childProcess.pid.toString(), '/f', '/t']);
        }
      } else {
        // Unix: 终止进程组
        try {
          if (childProcess.pid) {
            process.kill(-childProcess.pid, 'SIGTERM');
            // 200ms 后如果还没结束，发送 SIGKILL
            setTimeout(() => {
              try {
                if (childProcess.pid && !childProcess.killed) {
                  process.kill(-childProcess.pid, 'SIGKILL');
                }
              } catch (e) {
                // 进程可能已经结束
              }
            }, 200);
          }
        } catch (e) {
          // 回退到直接终止主进程
          try {
            childProcess.kill('SIGKILL');
          } catch (e2) {
            console.error(`Failed to kill process ${childProcess.pid}: ${e2}`);
          }
        }
      }
    };

    // 超时处理
    const timer = setTimeout(() => {
      timedOut = true;
      killProcess();
    }, timeout);

    // MCP 取消信号处理
    let abortHandler: (() => void) | null = null;
    if (abortSignal) {
      abortHandler = () => {
        cancelled = true;
        killProcess();
      };
      
      if (abortSignal.aborted) {
        // 信号已经被触发
        cancelled = true;
        killProcess();
      } else {
        // 监听取消信号
        abortSignal.addEventListener('abort', abortHandler);
      }
    }

    // 收集输出
    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // 处理进程错误
    childProcess.on('error', (err) => {
      error = err;
      // 清理包装命令的错误信息
      error.message = error.message.replace(wrappedCommand, command);
    });

    // 处理进程结束
    childProcess.on('exit', (code, sig) => {
      exitCode = code;
      signal = sig;
    });

    childProcess.on('close', async () => {
      clearTimeout(timer);
      
      // 清理取消信号监听器
      if (abortHandler && abortSignal) {
        abortSignal.removeEventListener('abort', abortHandler);
      }
      
      const duration = Date.now() - startTime;

      // 解析后台进程 PIDs（仅 Unix 系统）
      const backgroundPIDs: number[] = [];
      if (!isWindows && fs.existsSync(tempFilePath)) {
        try {
          const pgrepOutput = fs.readFileSync(tempFilePath, 'utf8');
          const lines = pgrepOutput.split('\n').filter(Boolean);

          for (const line of lines) {
            if (/^\d+$/.test(line)) {
              const pid = Number(line);
              // 排除 shell 子进程的 PID
              if (pid !== childProcess.pid) {
                backgroundPIDs.push(pid);
              }
            }
          }

          fs.unlinkSync(tempFilePath);
        } catch (e) {
          // 忽略清理错误
        }
      }

      resolve({
        success: !timedOut && !cancelled && !error, // 只关心命令是否正常执行完毕
        exitCode,
        signal,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
        workingDirectory,
        duration,
        timedOut,
        error: cancelled ? new Error('Command was cancelled by user') : error,
        backgroundPIDs,
        processGroupPID: childProcess.pid || null,
      });
    });
  });
}

export function registerRunShellCommandTool(server: McpServer): void {
  server.tool(
    'run_shell_command',
    'Executes a shell command in the specified working directory. Supports timeout, user cancellation, background process tracking, and comprehensive security checks.',
    runShellCommandSchema.shape,
    async ({ reason, command, working_directory, timeout }, extra) => {
      try {
        // 验证命令
        validateCommand(command);

        working_directory = working_directory || os.homedir();
        // 规范化文件路径
        const workingDir = normalizePath(working_directory);

        // 检查工作目录是否存在
        if (!fs.existsSync(workingDir)) {
          throw new HyperSystemToolError(
            `Working directory not found: ${workingDir}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }

        // 检查是否是目录
        const stats = fs.statSync(workingDir);
        if (!stats.isDirectory()) {
          throw new HyperSystemToolError(
            `Working directory path is not a directory: ${workingDir}`,
            ERROR_CODES.INVALID_PATH
          );
        }

        // 执行命令，传递取消信号
        const result = await executeCommand(command, workingDir, timeout, extra.signal);

        // 构建详细的输出信息（类似 Gemini CLI 的格式）
        const output = [];

        // 基本信息
        output.push(`Command: ${command}`);
        if (reason) {
          output.push(`Reason: ${reason}`);
        }
        output.push(`Working Directory: ${working_directory}`);
        output.push(`Duration: ${result.duration}ms`);
        output.push(`Exit Code: ${result.exitCode ?? '(none)'}`);
        output.push(`Signal: ${result.signal ?? '(none)'}`);
        output.push(`Success: ${result.success}`);

        // 状态信息
        if (result.timedOut) {
          output.push(`Status: TIMED OUT (${timeout}ms)`);
        } else if (result.error?.message === 'Command was cancelled by user') {
          output.push(`Status: CANCELLED BY USER`);
        }
        
        if (result.error) {
          output.push(`Error: ${result.error.message}`);
        } else {
          output.push(`Error: (none)`);
        }

        // 进程信息
        if (result.backgroundPIDs.length > 0) {
          output.push(`Background PIDs: ${result.backgroundPIDs.join(', ')}`);
        } else {
          output.push(`Background PIDs: (none)`);
        }
        output.push(`Process Group PGID: ${result.processGroupPID ?? '(none)'}`);

        output.push(''); // 空行分隔

        // 输出信息
        if (result.stdout) {
          output.push('STDOUT:');
          output.push(result.stdout);
          output.push('');
        } else {
          output.push('STDOUT: (empty)');
          output.push('');
        }

        if (result.stderr) {
          output.push('STDERR:');
          output.push(result.stderr);
          output.push('');
        } else {
          output.push('STDERR: (empty)');
          output.push('');
        }

        // 安全警告（如果有后台进程）
        if (result.backgroundPIDs.length > 0) {
          output.push('⚠️  Warning: Background processes detected. Use the following commands to manage them:');
          output.push(`   Terminate process group: kill -- -${result.processGroupPID}`);
          output.push(`   Send signal to group: kill -s SIGNAL -- -${result.processGroupPID}`);
          output.push('');
        }

        // 生成摘要
        let status: string;
        if (result.timedOut) {
          status = 'TIMED OUT';
        } else if (result.error?.message === 'Command was cancelled by user') {
          status = 'CANCELLED';
        } else if (result.error) {
          status = 'ERROR';
        } else if (result.success) {
          status = 'SUCCESS';
        } else {
          status = 'FAILED';
        }

        const commandRoot = getCommandRoot(command);
        const summary = reason
          ? `${commandRoot}: ${reason} (${status}, ${result.duration}ms)`
          : `Executed ${commandRoot}: ${command} (${status}, ${result.duration}ms)`;

        return {
          content: [
            { type: 'text', text: output.join('\n') }
          ],
          summary,
          isError: !result.success
        };

      } catch (error) {
        const errorMessage = error instanceof HyperSystemToolError
          ? error.message
          : `Failed to execute command: ${error}`;

        return {
          content: [
            { type: 'text', text: `Error: ${errorMessage}` }
          ],
          isError: true
        };
      }
    }
  );
}