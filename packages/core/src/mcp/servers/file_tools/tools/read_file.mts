import fs from 'fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  validateAndNormalizePath, 
  validateFileExtension, 
  validateFileSize, 
  readFileContent, 
  limitOutputLines,
  getRelativePathDisplay,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const readFileSchema = z.object({
  absolute_path: z.string().describe('The absolute path to the file to read'),
  offset: z.number().int().min(0).optional().describe('Optional: The 0-based line number to start reading from'),
  limit: z.number().int().min(1).optional().describe('Optional: Maximum number of lines to read'),
});

export function registerReadFileTool(server: McpServer, workspacePath: string): void {
  server.tool(
    'read_file',
    'Reads and returns the content of a specified file from the local filesystem. Supports text files with optional line range specification.',
    readFileSchema.shape,
    async ({ absolute_path, offset, limit }) => {
      const config = getConfig();
      
      try {
        // 验证和规范化路径
        const normalizedPath = validateAndNormalizePath(absolute_path, workspacePath);
        
        // 检查文件是否存在
        if (!fs.existsSync(normalizedPath)) {
          throw new FileToolError(
            `File not found: ${absolute_path}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 验证文件扩展名
        validateFileExtension(normalizedPath);
        
        // 验证文件大小
        validateFileSize(normalizedPath);
        
        // 读取文件内容（带超时控制）
        const content = await withTimeout(
          () => Promise.resolve(readFileContent(normalizedPath, offset, limit)),
          config.fileOperationTimeout,
          `File read operation timed out for: ${absolute_path}`
        );
        
        // 限制输出行数
        const limitedContent = limitOutputLines(content);
        
        // 生成显示信息
        const relativePath = getRelativePathDisplay(normalizedPath, workspacePath);
        const stats = fs.statSync(normalizedPath);
        
        let summary = `Read file: ${relativePath}`;
        if (offset !== undefined || limit !== undefined) {
          const endLine = limit ? (offset || 0) + limit : 'end';
          summary += ` (lines ${offset || 0}-${endLine})`;
        }
        summary += ` (${stats.size} bytes)`;
        
        return {
          content: [
            { type: 'text', text: limitedContent }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to read file: ${error}`;
          
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