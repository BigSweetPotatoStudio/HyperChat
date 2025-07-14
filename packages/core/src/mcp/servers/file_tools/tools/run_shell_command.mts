import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  validateAndNormalizePath, 
  validateCommand
} from '../utils.mjs';
import { FileToolError, ERROR_CODES } from '../lib.mjs';

const runShellCommandSchema = z.object({
  command: z.string().describe('The shell command to execute'),
  working_directory: z.string().optional().describe('Working directory for the command (relative to workspace root)'),
  timeout: z.number().int().min(1000).max(300000).default(30000).describe('Command timeout in milliseconds (1s to 5min)'),
  capture_output: z.boolean().default(true).describe('Whether to capture and return command output'),
});

interface CommandResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  command: string;
  workingDirectory: string;
  duration: number;
  timedOut: boolean;
}

async function executeCommand(
  command: string,
  workingDirectory: string,
  timeout: number,
  captureOutput: boolean
): Promise<CommandResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // 根据操作系统选择 shell
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd' : 'bash';
    const args = isWindows ? ['/c', command] : ['-c', command];
    
    const childProcess = spawn(shell, args, {
      cwd: workingDirectory,
      stdio: captureOutput ? 'pipe' : 'inherit',
      detached: !isWindows, // 在 Unix 系统上创建进程组
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    // 设置超时
    const timer = setTimeout(() => {
      timedOut = true;
      
      // 终止进程
      if (isWindows) {
        // Windows: 使用 taskkill 终止进程树
        spawn('taskkill', ['/pid', childProcess.pid!.toString(), '/f', '/t']);
      } else {
        // Unix: 终止进程组
        try {
          process.kill(-childProcess.pid!, 'SIGTERM');
          // 如果 SIGTERM 不起作用，500ms 后发送 SIGKILL
          setTimeout(() => {
            try {
              process.kill(-childProcess.pid!, 'SIGKILL');
            } catch (error) {
              // 进程可能已经结束
            }
          }, 500);
        } catch (error) {
          // 回退到直接终止主进程
          childProcess.kill('SIGKILL');
        }
      }
    }, timeout);
    
    // 收集输出
    if (captureOutput) {
      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    // 处理进程结束
    childProcess.on('close', (exitCode) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      
      resolve({
        success: exitCode === 0 && !timedOut,
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
        workingDirectory,
        duration,
        timedOut,
      });
    });
    
    // 处理错误
    childProcess.on('error', (error) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      
      resolve({
        success: false,
        exitCode: null,
        stdout: stdout.trim(),
        stderr: error.message,
        command,
        workingDirectory,
        duration,
        timedOut,
      });
    });
  });
}

export function registerRunShellCommandTool(server: McpServer, workspacePath: string): void {
  server.tool(
    'run_shell_command',
    'Executes a shell command in the specified working directory. Supports timeout and output capture.',
    runShellCommandSchema.shape,
    async ({ command, working_directory, timeout, capture_output }) => {
      // const config = getConfig(); // 暂未使用
      
      try {
        // 验证命令
        validateCommand(command);
        
        // 确定工作目录
        const workingDir = working_directory 
          ? validateAndNormalizePath(working_directory, workspacePath)
          : workspacePath;
        
        // 检查工作目录是否存在
        if (!fs.existsSync(workingDir)) {
          throw new FileToolError(
            `Working directory not found: ${working_directory || 'workspace root'}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 检查是否是目录
        const stats = fs.statSync(workingDir);
        if (!stats.isDirectory()) {
          throw new FileToolError(
            `Working directory path is not a directory: ${working_directory}`,
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 执行命令
        const result = await executeCommand(command, workingDir, timeout, capture_output);
        
        // 生成显示信息
        const workingDirDisplay = working_directory 
          ? path.relative(workspacePath, workingDir) || '.'
          : '(workspace root)';
        
        const output = [];
        
        // 添加命令信息
        output.push(`Command: ${command}`);
        output.push(`Working Directory: ${workingDirDisplay}`);
        output.push(`Duration: ${result.duration}ms`);
        output.push(`Exit Code: ${result.exitCode ?? 'N/A'}`);
        output.push(`Success: ${result.success}`);
        
        if (result.timedOut) {
          output.push(`Status: TIMED OUT (${timeout}ms)`);
        }
        
        output.push(''); // 空行
        
        // 添加输出
        if (capture_output) {
          if (result.stdout) {
            output.push('STDOUT:');
            output.push(result.stdout);
            output.push('');
          }
          
          if (result.stderr) {
            output.push('STDERR:');
            output.push(result.stderr);
            output.push('');
          }
          
          if (!result.stdout && !result.stderr) {
            output.push('(No output captured)');
          }
        } else {
          output.push('(Output not captured - command ran in inherit mode)');
        }
        
        // 生成摘要
        const status = result.timedOut ? 'TIMED OUT' : 
                      result.success ? 'SUCCESS' : 'FAILED';
        const summary = `Executed command: ${command} (${status}, ${result.duration}ms)`;
        
        return {
          content: [
            { type: 'text', text: output.join('\n') }
          ],
          summary,
          isError: !result.success
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
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