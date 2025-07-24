import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { glob } from 'glob';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  normalizePath,
  withTimeout
} from '../utils.mjs';
import { HyperSystemToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const searchFileContentSchema = z.object({
  pattern: z.string().describe('Regular expression pattern to search for in file contents'),
  path: z.string().describe('Directory to search in. This parameter is required.'),
  include: z.string().optional().describe('File pattern to include in the search (e.g., "*.js", "*.{ts,tsx}")'),
  exclude: z.string().optional().describe('File pattern to exclude from the search (e.g., "*.min.js", "node_modules/**")'),
  case_sensitive: z.boolean().default(false).describe('Whether the search should be case sensitive'),
  max_results: z.number().int().min(1).max(1000).default(100).describe('Maximum number of matches to return'),
  context_lines: z.number().int().min(0).max(10).default(0).describe('Number of context lines to show before and after each match'),
});

interface SearchMatch {
  filePath: string;
  lineNumber: number;
  line: string;
  contextBefore: string[];
  contextAfter: string[];
}

async function searchInFile(
  filePath: string,
  pattern: RegExp,
  contextLines: number
): Promise<SearchMatch[]> {
  const matches: SearchMatch[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.test(line)) {
        // 收集上下文行
        const contextBefore = contextLines > 0
          ? lines.slice(Math.max(0, i - contextLines), i)
          : [];
        const contextAfter = contextLines > 0
          ? lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines))
          : [];

        matches.push({
          filePath,
          lineNumber: i + 1, // 1-based line numbers
          line,
          contextBefore,
          contextAfter,
        });
      }
    }
  } catch (error) {
    // 忽略无法读取的文件（可能是二进制文件或权限问题）
    console.warn(`Cannot read file ${filePath}: ${error}`);
  }

  return matches;
}

export function registerSearchFileContentTool(server: McpServer): void {
  server.tool(
    'search_file_content',
    'Searches for a pattern in file contents using regular expressions. Can search in specific directories and file types.',
    searchFileContentSchema.shape,
    async ({ pattern, path: searchPath, include, exclude, case_sensitive, max_results, context_lines }) => {
      const config = getConfig();

      try {
        // 验证必需参数
        if (!searchPath || typeof searchPath !== 'string' || searchPath.trim() === '') {
          throw new HyperSystemToolError(
            'Parameter "path" is required and must be a non-empty string',
            ERROR_CODES.INVALID_PATH
          );
        }

        // 确定搜索路径
        const basePath = normalizePath(searchPath);

        // 检查搜索路径是否存在
        if (!fs.existsSync(basePath)) {
          throw new HyperSystemToolError(
            `Search path not found: ${searchPath || 'workspace root'}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }

        // 构建正则表达式
        const regexFlags = case_sensitive ? 'g' : 'gi';
        let regex: RegExp;
        try {
          regex = new RegExp(pattern, regexFlags);
        } catch (error) {
          throw new HyperSystemToolError(
            `Invalid regular expression pattern: ${pattern}`,
            ERROR_CODES.INVALID_PATH
          );
        }

        // 构建文件搜索模式
        const filePattern = include || '**/*';
        const globOptions = {
          cwd: basePath,
          absolute: true,
          nodir: true, // 只包含文件
          follow: false, // 不跟随符号链接
          ignore: [
            'node_modules/**',
            '.git/**',
            '.svn/**',
            '.hg/**',
            '**/.*', // 隐藏文件
            '**/*.min.*', // 压缩文件
            '**/*.map', // source maps
            ...(exclude ? [exclude] : []),
          ],
        };

        // 获取文件列表
        const files = await withTimeout(
          () => glob(filePattern, globOptions) as Promise<string[]>,
          config.fileOperationTimeout,
          `File search operation timed out for pattern: ${filePattern}`
        );

        // 过滤文件类型（跳过可能的二进制文件）
        const textFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          // 常见的文本文件扩展名
          const textExtensions = [
            '.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx',
            '.py', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.php', '.rb', '.swift',
            '.kt', '.scala', '.clj', '.hs', '.ml', '.fs', '.elm', '.dart', '.vue',
            '.svelte', '.astro', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf',
            '.log', '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.dockerfile', '.gitignore', '.gitattributes', '.editorconfig', '.env',
          ];

          // 有扩展名的文件按白名单过滤
          if (ext !== '') {
            return textExtensions.includes(ext);
          }

          // 没有扩展名的文件：检查文件大小，小于256KB才包含
          try {
            const stats = fs.statSync(file);
            return stats.size < 256 * 1024; // 256KB
          } catch (error) {
            // 无法获取文件信息则跳过
            return false;
          }
        });

        // 在文件中搜索
        const allMatches: SearchMatch[] = [];
        const searchPromises = textFiles.map((file: string) => searchInFile(file, regex, context_lines));

        const resultsArrays = await withTimeout(
          () => Promise.all(searchPromises),
          config.fileOperationTimeout * 2, // 给搜索更多时间
          `Content search operation timed out for pattern: ${pattern}`
        );

        // 合并结果
        for (const matches of resultsArrays) {
          allMatches.push(...matches);
        }

        // 限制结果数量
        const limitedMatches = allMatches.slice(0, max_results);
        const truncated = allMatches.length > max_results;

        // 按文件路径和行号排序
        limitedMatches.sort((a, b) => {
          if (a.filePath !== b.filePath) {
            return a.filePath.localeCompare(b.filePath);
          }
          return a.lineNumber - b.lineNumber;
        });

        // 生成显示信息
        const searchPathDisplay = searchPath;

        const fileCount = new Set(limitedMatches.map(m => m.filePath)).size;

        // 格式化输出
        const output = limitedMatches.map(match => {
          const relativePath = path.relative(basePath, match.filePath);
          const lines = [
            `${relativePath}:${match.lineNumber}: ${match.line}`,
          ];

          // 添加上下文行
          if (context_lines > 0) {
            match.contextBefore.forEach((line, i) => {
              const lineNum = match.lineNumber - match.contextBefore.length + i;
              lines.unshift(`${relativePath}:${lineNum}- ${line}`);
            });

            match.contextAfter.forEach((line, i) => {
              const lineNum = match.lineNumber + i + 1;
              lines.push(`${relativePath}:${lineNum}- ${line}`);
            });

            lines.push(''); // 添加空行分隔
          }

          return lines.join('\n');
        }).join('\n');

        let summary = `Found ${limitedMatches.length} matches in ${fileCount} files`;
        if (searchPath) {
          summary += ` in ${searchPathDisplay}`;
        }
        if (truncated) {
          summary += ` (showing first ${max_results} of ${allMatches.length} matches)`;
        }

        // 添加截断警告
        const displayText = output + (truncated
          ? `\n\n... (${allMatches.length - max_results} more matches truncated)`
          : '');

        return {
          content: [
            { type: 'text', text: displayText || `No matches found for pattern: ${pattern}` }
          ],
          summary
        };

      } catch (error) {
        const errorMessage = error instanceof HyperSystemToolError
          ? error.message
          : `Failed to search file content: ${error}`;

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