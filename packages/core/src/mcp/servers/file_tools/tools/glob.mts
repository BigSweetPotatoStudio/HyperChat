import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import * as globPkg from 'glob';
const globFunc = globPkg.glob;
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  validateAndNormalizePath, 
  getRelativePathDisplay,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const globSchema = z.object({
  pattern: z.string().describe('Glob pattern to match files (e.g., "*.js", "**/*.ts", "src/**/*.{js,ts}")'),
  base_path: z.string().optional().describe('Base directory to search from (defaults to workspace root)'),
  include_hidden: z.boolean().default(false).describe('Whether to include hidden files and directories'),
  max_results: z.number().int().min(1).max(1000).default(100).describe('Maximum number of results to return'),
});

export function registerGlobTool(server: McpServer, workspacePath: string): void {
  server.tool(
    'glob',
    'Finds files and directories matching a glob pattern. Supports advanced patterns like wildcards, character classes, and brace expansion.',
    globSchema.shape,
    async ({ pattern, base_path, include_hidden, max_results }) => {
      const config = getConfig();
      
      try {
        // 确定搜索基础路径
        const basePath = base_path 
          ? validateAndNormalizePath(base_path, workspacePath)
          : workspacePath;
        
        // 检查基础路径是否存在
        if (!fs.existsSync(basePath)) {
          throw new FileToolError(
            `Base path not found: ${base_path || 'workspace root'}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 构建 glob 选项
        const globOptions = {
          cwd: basePath,
          dot: include_hidden,
          absolute: true,
          nodir: false, // 包含目录
          follow: false, // 不跟随符号链接（安全考虑）
          ignore: [
            'node_modules/**',
            '.git/**',
            '.svn/**',
            '.hg/**',
            // 可以从配置中读取更多忽略模式
          ],
        };
        
        // 执行 glob 搜索（带超时控制）
        const matches = await withTimeout(
          () => globFunc(pattern, globOptions),
          config.fileOperationTimeout,
          `Glob search operation timed out for pattern: ${pattern}`
        );
        
        // 限制结果数量
        const limitedMatches = matches.slice(0, max_results);
        const truncated = matches.length > max_results;
        
        // 收集文件信息
        const results: Array<{
          path: string;
          relativePath: string;
          type: 'file' | 'directory';
          size: number;
          modified: string;
        }> = [];
        
        for (const match of limitedMatches) {
          try {
            const stats = fs.statSync(match);
            const relativePath = getRelativePathDisplay(match, workspacePath);
            
            results.push({
              path: match,
              relativePath,
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.size,
              modified: stats.mtime.toISOString(),
            });
          } catch (error) {
            // 忽略无法访问的文件
            console.warn(`Cannot access ${match}: ${error}`);
          }
        }
        
        // 排序结果
        results.sort((a, b) => {
          // 目录优先，然后按路径排序
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.relativePath.localeCompare(b.relativePath);
        });
        
        // 生成显示信息
        const basePathDisplay = base_path 
          ? getRelativePathDisplay(basePath, workspacePath)
          : '(workspace root)';
        
        const fileCount = results.filter(r => r.type === 'file').length;
        const dirCount = results.filter(r => r.type === 'directory').length;
        
        // 格式化输出
        const output = results.map(result => {
          const type = result.type === 'directory' ? 'DIR' : 'FILE';
          const size = result.type === 'directory' ? '-'.padStart(10) : result.size.toString().padStart(10);
          return `${type.padEnd(4)} ${size} ${result.modified} ${result.relativePath}`;
        }).join('\n');
        
        let summary = `Found ${fileCount} files and ${dirCount} directories matching "${pattern}"`;
        if (base_path) {
          summary += ` in ${basePathDisplay}`;
        }
        if (truncated) {
          summary += ` (showing first ${max_results} of ${matches.length} results)`;
        }
        
        // 添加截断警告
        const displayText = output + (truncated 
          ? `\n\n... (${matches.length - max_results} more results truncated)`
          : '');
        
        return {
          content: [
            { type: 'text', text: displayText || `No files found matching pattern: ${pattern}` }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to search files with glob pattern: ${error}`;
          
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