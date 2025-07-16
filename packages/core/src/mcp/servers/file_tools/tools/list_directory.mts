import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  validateAndNormalizePath, 
  getRelativePathDisplay,
  withTimeout,
  isInGitRepository,
  findGitRoot,
  loadAllGitignoreRules,
  shouldIgnoreFile
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const listDirectorySchema = z.object({
  absolute_path: z.string().describe('The absolute path to the directory to list'),
  recursive: z.boolean().default(false).describe('Whether to list files recursively'),
  include_hidden: z.boolean().default(false).describe('Whether to include hidden files and directories'),
  max_depth: z.number().int().min(1).max(10).default(3).describe('Maximum depth for recursive listing'),
  respect_git_ignore: z.boolean().default(true).describe('Whether to respect .gitignore patterns when listing files. Only available in git repositories. Defaults to true.'),
});

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  permissions: string;
}

function formatPermissions(mode: number): string {
  const permissions = [];
  
  // Owner permissions
  permissions.push((mode & 0o400) ? 'r' : '-');
  permissions.push((mode & 0o200) ? 'w' : '-');
  permissions.push((mode & 0o100) ? 'x' : '-');
  
  // Group permissions
  permissions.push((mode & 0o040) ? 'r' : '-');
  permissions.push((mode & 0o020) ? 'w' : '-');
  permissions.push((mode & 0o010) ? 'x' : '-');
  
  // Others permissions
  permissions.push((mode & 0o004) ? 'r' : '-');
  permissions.push((mode & 0o002) ? 'w' : '-');
  permissions.push((mode & 0o001) ? 'x' : '-');
  
  return permissions.join('');
}

function listDirectory(
  dirPath: string, 
  workspacePath: string, 
  globalPath: string | undefined,
  recursive: boolean, 
  includeHidden: boolean,
  maxDepth: number,
  respectGitIgnore: boolean,
  gitRoot: string | null = null,
  currentDepth: number = 0
): FileInfo[] {
  const files: FileInfo[] = [];
  
  if (currentDepth >= maxDepth) {
    return files;
  }
  
  // 为当前目录加载 gitignore 规则
  let currentGitignoreRules: string[] = [];
  if (respectGitIgnore && gitRoot) {
    const { rules } = loadAllGitignoreRules(dirPath, gitRoot);
    currentGitignoreRules = rules;
  }
  
  const entries = fs.readdirSync(dirPath);
  
  for (const entry of entries) {
    // 跳过隐藏文件（如果不包含隐藏文件）
    if (!includeHidden && entry.startsWith('.')) {
      continue;
    }
    
    const fullPath = path.join(dirPath, entry);
    
    // 检查 gitignore 规则
    if (respectGitIgnore && gitRoot && currentGitignoreRules.length > 0) {
      if (shouldIgnoreFile(fullPath, gitRoot, currentGitignoreRules)) {
        continue;
      }
    }
    
    try {
      const stats = fs.statSync(fullPath);
      const relativePath = getRelativePathDisplay(fullPath, workspacePath);
      
      const fileInfo: FileInfo = {
        name: entry,
        path: relativePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
        permissions: formatPermissions(stats.mode),
      };
      
      files.push(fileInfo);
      
      // 递归处理子目录
      if (recursive && stats.isDirectory()) {
        const subFiles = listDirectory(
          fullPath, 
          workspacePath, 
          globalPath,
          recursive, 
          includeHidden, 
          maxDepth, 
          respectGitIgnore,
          gitRoot,
          currentDepth + 1
        );
        files.push(...subFiles);
      }
    } catch (error) {
      // 忽略无权限访问的文件
      console.warn(`Cannot access ${fullPath}: ${error}`);
    }
  }
  
  return files;
}

export function registerListDirectoryTool(server: McpServer, workspacePath: string, globalPath?: string): void {
  server.tool(
    'list_directory',
    'Lists files and directories in a specified directory. Supports recursive listing and hidden file inclusion.',
    listDirectorySchema.shape,
    async ({ absolute_path, recursive, include_hidden, max_depth, respect_git_ignore }) => {
      const config = getConfig();
      
      try {
        // 验证和规范化路径
        const normalizedPath = validateAndNormalizePath(absolute_path, workspacePath, globalPath);
        
        // 检查目录是否存在
        if (!fs.existsSync(normalizedPath)) {
          throw new FileToolError(
            `Directory not found: ${absolute_path}`,
            ERROR_CODES.FILE_NOT_FOUND
          );
        }
        
        // 检查是否是目录
        const stats = fs.statSync(normalizedPath);
        if (!stats.isDirectory()) {
          throw new FileToolError(
            `Path is not a directory: ${absolute_path}`,
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 初始化 gitignore 相关变量
        let gitRoot: string | null = null;
        let gitignoreRules: string[] = [];
        let gitignoreSources: string[] = [];
        
        // 如果启用了 gitignore 支持，加载规则
        if (respect_git_ignore && isInGitRepository(normalizedPath)) {
          gitRoot = findGitRoot(normalizedPath);
          if (gitRoot) {
            const { rules, sources } = loadAllGitignoreRules(normalizedPath, gitRoot);
            gitignoreRules = rules;
            gitignoreSources = sources;
          }
        }
        
        // 列出目录内容（带超时控制）
        const files = await withTimeout(
          () => Promise.resolve(listDirectory(
            normalizedPath, 
            workspacePath, 
            globalPath,
            recursive, 
            include_hidden, 
            max_depth,
            respect_git_ignore,
            gitRoot
          )),
          config.fileOperationTimeout,
          `Directory listing operation timed out for: ${absolute_path}`
        );
        
        // 排序文件列表
        files.sort((a, b) => {
          // 目录优先，然后按名称排序
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        
        // 生成显示信息
        const relativePath = getRelativePathDisplay(normalizedPath, workspacePath);
        const fileCount = files.filter(f => f.type === 'file').length;
        const dirCount = files.filter(f => f.type === 'directory').length;
        
        // 格式化输出
        const output = files.map(file => {
          const type = file.type === 'directory' ? 'DIR' : 'FILE';
          const size = file.type === 'directory' ? '-'.padStart(10) : file.size.toString().padStart(10);
          return `${file.permissions} ${type.padEnd(4)} ${size} ${file.modified} ${file.path}`;
        }).join('\n');
        
        let summary = `Listed directory: ${relativePath} (${fileCount} files, ${dirCount} directories)`;
        if (respect_git_ignore && gitignoreSources.length > 0) {
          summary += ` - Applied gitignore rules from ${gitignoreSources.length} file(s)`;
        }
        
        return {
          content: [
            { type: 'text', text: output || '(empty directory)' }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to list directory: ${error}`;
          
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