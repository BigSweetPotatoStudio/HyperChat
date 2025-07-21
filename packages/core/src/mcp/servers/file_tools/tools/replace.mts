import fs from 'fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  normalizePath,
  validateFileExtension,
  validateFileSize,
  readFileContent,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const replaceSchema = z.object({
  absolute_path: z.string().describe('The absolute path to the file to edit'),
  old_text: z.string().describe('The text to search for and replace'),
  new_text: z.string().describe('The text to replace with'),
  replace_all: z.boolean().default(false).describe('Whether to replace all occurrences (true) or just the first one (false)'),
});

export function registerReplaceTool(server: McpServer): void {
  server.tool(
    'replace',
    'Replaces text in a specified file. Can replace first occurrence or all occurrences.',
    replaceSchema.shape,
    async ({ absolute_path, old_text, new_text, replace_all }) => {
      const config = getConfig();
      
      try {
        // 规范化路径
        const normalizedPath = normalizePath(absolute_path);
        
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
        
        // 读取文件内容
        const originalContent = await withTimeout(
          () => Promise.resolve(readFileContent(normalizedPath)),
          config.fileOperationTimeout,
          `File read operation timed out for: ${absolute_path}`
        );
        
        // 检查是否包含要替换的文本
        if (!originalContent.includes(old_text)) {
          throw new FileToolError(
            `Text not found in file: "${old_text}"`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 执行替换
        let newContent: string;
        let replaceCount: number;
        
        if (replace_all) {
          // 替换所有出现的文本
          const regex = new RegExp(old_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          newContent = originalContent.replace(regex, new_text);
          replaceCount = (originalContent.match(regex) || []).length;
        } else {
          // 只替换第一个出现的文本
          newContent = originalContent.replace(old_text, new_text);
          replaceCount = 1;
        }
        
        // 如果内容没有变化，说明替换没有生效
        if (newContent === originalContent) {
          throw new FileToolError(
            `No replacements made. Text "${old_text}" not found or replacement is identical`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 写入新内容
        await withTimeout(
          () => {
            return new Promise<void>((resolve, reject) => {
              fs.writeFile(normalizedPath, newContent, 'utf8', (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          },
          config.fileOperationTimeout,
          `File write operation timed out for: ${absolute_path}`
        );
        
        // 生成显示信息
        const relativePath = normalizedPath;
        const stats = fs.statSync(normalizedPath);
        
        // 计算变化的统计信息
        const originalLines = originalContent.split('\n').length;
        const newLines = newContent.split('\n').length;
        const lineDiff = newLines - originalLines;
        
        const summary = `Replaced ${replaceCount} occurrence${replaceCount > 1 ? 's' : ''} in ${relativePath}`;
        
        // 生成差异显示
        const diffDisplay = [
          `File: ${relativePath}`,
          `Replacements: ${replaceCount}`,
          `Lines: ${originalLines} → ${newLines} (${lineDiff >= 0 ? '+' : ''}${lineDiff})`,
          `Size: ${stats.size} bytes`,
          '',
          'Preview of changes:',
          `- "${old_text}"`,
          `+ "${new_text}"`
        ].join('\n');
        
        return {
          content: [
            { type: 'text', text: diffDisplay }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to replace text in file: ${error}`;
          
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