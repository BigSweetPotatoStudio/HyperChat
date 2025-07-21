import fs from 'fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  normalizePath, 
  validateFileExtension, 
  validateFileSize,
  readFileContent,
  limitOutputLines,
  getRelativePathDisplay,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const readManyFilesSchema = z.object({
  absolute_paths: z.array(z.string()).max(50).describe('Array of absolute paths to files to read'),
  include_metadata: z.boolean().default(true).describe('Whether to include file metadata (size, modification time, etc.)'),
  max_lines_per_file: z.number().int().min(1).optional().describe('Maximum number of lines to read per file'),
  skip_errors: z.boolean().default(true).describe('Whether to skip files that cannot be read and continue with others'),
});

interface FileReadResult {
  path: string;
  relativePath: string;
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    size: number;
    lines: number;
    modified: string;
    encoding: string;
  };
}

async function readSingleFile(
  filePath: string,
  maxLines?: number,
  includeMetadata: boolean = true
): Promise<FileReadResult> {
  const relativePath = getRelativePathDisplay(filePath);
  
  try {
    // 验证文件存在
    if (!fs.existsSync(filePath)) {
      throw new FileToolError(
        `File not found: ${filePath}`,
        ERROR_CODES.FILE_NOT_FOUND
      );
    }
    
    // 验证文件扩展名
    validateFileExtension(filePath);
    
    // 验证文件大小
    validateFileSize(filePath);
    
    // 读取文件内容
    const content = readFileContent(filePath);
    
    // 限制行数
    const finalContent = maxLines 
      ? limitOutputLines(content, maxLines)
      : content;
    
    // 收集元数据
    let metadata;
    if (includeMetadata) {
      const stats = fs.statSync(filePath);
      metadata = {
        size: stats.size,
        lines: content.split('\n').length,
        modified: stats.mtime.toISOString(),
        encoding: 'utf-8',
      };
    }
    
    return {
      path: filePath,
      relativePath,
      success: true,
      content: finalContent,
      metadata,
    };
    
  } catch (error) {
    return {
      path: filePath,
      relativePath,
      success: false,
      error: error instanceof FileToolError ? error.message : `${error}`,
    };
  }
}

export function registerReadManyFilesTool(server: McpServer): void {
  server.tool(
    'read_many_files',
    'Reads multiple files at once. Useful for batch operations or when you need to analyze multiple files together.',
    readManyFilesSchema.shape,
    async ({ absolute_paths, include_metadata, max_lines_per_file, skip_errors }) => {
      const config = getConfig();
      
      try {
        // 验证文件数量
        if (absolute_paths.length === 0) {
          throw new FileToolError(
            'No file paths provided',
            ERROR_CODES.INVALID_PATH
          );
        }
        
        if (absolute_paths.length > config.maxBatchFiles) {
          throw new FileToolError(
            `Too many files requested. Maximum allowed: ${config.maxBatchFiles}`,
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 验证和规范化所有路径
        const normalizedPaths = absolute_paths.map(filePath => 
          normalizePath(filePath)
        );
        
        // 并行读取所有文件
        const readPromises = normalizedPaths.map(filePath => 
          readSingleFile(filePath, max_lines_per_file, include_metadata)
        );
        
        const results = await withTimeout(
          () => Promise.all(readPromises),
          config.fileOperationTimeout * 2, // 给批量操作更多时间
          `Batch file read operation timed out for ${absolute_paths.length} files`
        );
        
        // 分离成功和失败的结果
        const successResults = results.filter(r => r.success);
        const errorResults = results.filter(r => !r.success);
        
        // 如果有错误且不跳过错误，则抛出异常
        if (errorResults.length > 0 && !skip_errors) {
          throw new FileToolError(
            `Failed to read ${errorResults.length} files: ${errorResults.map(r => r.error).join(', ')}`,
            ERROR_CODES.PERMISSION_DENIED
          );
        }
        
        // 生成输出
        const output = [];
        
        // 添加概要信息
        output.push(`Successfully read ${successResults.length} of ${absolute_paths.length} files`);
        if (errorResults.length > 0) {
          output.push(`Failed to read ${errorResults.length} files`);
        }
        output.push(''); // 空行
        
        // 添加每个文件的内容
        for (const result of successResults) {
          output.push(`=== ${result.relativePath} ===`);
          
          if (include_metadata && result.metadata) {
            output.push(`Size: ${result.metadata.size} bytes | Lines: ${result.metadata.lines} | Modified: ${result.metadata.modified}`);
            output.push('');
          }
          
          output.push(result.content || '(empty file)');
          output.push(''); // 空行分隔
        }
        
        // 添加错误信息
        if (errorResults.length > 0) {
          output.push('=== ERRORS ===');
          for (const result of errorResults) {
            output.push(`${result.relativePath}: ${result.error}`);
          }
        }
        
        // 生成统计信息
        const totalSize = successResults.reduce((sum, r) => sum + (r.metadata?.size || 0), 0);
        const totalLines = successResults.reduce((sum, r) => sum + (r.metadata?.lines || 0), 0);
        
        const summary = [
          `Read ${successResults.length} files`,
          totalSize > 0 ? `(${totalSize} bytes total)` : '',
          totalLines > 0 ? `(${totalLines} lines total)` : '',
          errorResults.length > 0 ? `with ${errorResults.length} errors` : '',
        ].filter(Boolean).join(' ');
        
        return {
          content: [
            { type: 'text', text: output.join('\n') }
          ],
          summary
        };
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to read multiple files: ${error}`;
          
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