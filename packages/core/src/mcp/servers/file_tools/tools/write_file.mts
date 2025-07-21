import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  normalizePath, 
  validateFileExtension, 
  getRelativePathDisplay,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const writeFileSchema = z.object({
  absolute_path: z.string().describe('The absolute path to the file to write'),
  content: z.string().describe('The content to write to the file'),
  create_directories: z.boolean().default(true).describe('Whether to create parent directories if they don\'t exist'),
});

export function registerWriteFileTool(server: McpServer): void {
  server.tool(
    'write_file',
    'Writes content to a specified file in the local filesystem. Can create parent directories if needed.',
    writeFileSchema.shape,
    async ({ absolute_path, content, create_directories }) => {
      const config = getConfig();
      
      try {
        // 规范化路径
        const normalizedPath = normalizePath(absolute_path);
        
        // 验证文件扩展名
        validateFileExtension(normalizedPath);
        
        // 检查父目录是否存在
        const parentDir = path.dirname(normalizedPath);
        if (!fs.existsSync(parentDir)) {
          if (create_directories) {
            fs.mkdirSync(parentDir, { recursive: true });
          } else {
            throw new FileToolError(
              `Parent directory does not exist: ${parentDir}`,
              ERROR_CODES.FILE_NOT_FOUND
            );
          }
        }
        
        // 检查文件是否已存在
        const fileExists = fs.existsSync(normalizedPath);
        
        // 写入文件内容（带超时控制）
        await withTimeout(
          () => {
            return new Promise<void>((resolve, reject) => {
              fs.writeFile(normalizedPath, content, 'utf8', (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          },
          config.fileOperationTimeout,
          `File write operation timed out for: ${absolute_path}`
        );
        

        const stats = fs.statSync(normalizedPath);
        const action = fileExists ? 'Updated' : 'Created';
        
        const summary = `${action} file: ${absolute_path} (${stats.size} bytes, ${content.split('\n').length} lines)`;
        
        return {
          content: [
            { type: 'text', text: `Successfully ${action.toLowerCase()} file: ${absolute_path}` }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to write file: ${error}`;
          
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