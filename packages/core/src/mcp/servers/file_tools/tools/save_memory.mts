import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  getRelativePathDisplay,
  withTimeout
} from '../utils.mjs';
import { FileToolError, ERROR_CODES, getConfig } from '../lib.mjs';

const saveMemorySchema = z.object({
  content: z.string().describe('The content to save to memory'),
  category: z.string().default('general').describe('Memory category/topic for organization'),
  title: z.string().optional().describe('Optional title for the memory entry'),
  tags: z.array(z.string()).default([]).describe('Tags for categorizing and searching memories'),
  append: z.boolean().default(false).describe('Whether to append to existing memory or create new entry'),
});

interface MemoryEntry {
  id: string;
  timestamp: string;
  title?: string;
  content: string;
  category: string;
  tags: string[];
}

interface MemoryFile {
  version: string;
  created: string;
  updated: string;
  entries: MemoryEntry[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getMemoryFilePath(workspacePath: string, category: string): string {
  const memoriesDir = path.join(workspacePath, '.hyperchat', 'memories');
  return path.join(memoriesDir, `${category}.json`);
}

function loadMemoryFile(filePath: string): MemoryFile {
  if (!fs.existsSync(filePath)) {
    return {
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      entries: [],
    };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // 验证文件格式
    if (!data.version || !data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid memory file format');
    }
    
    return data;
  } catch (error) {
    throw new FileToolError(
      `Failed to load memory file: ${error}`,
      ERROR_CODES.FILE_NOT_FOUND
    );
  }
}

function saveMemoryFile(filePath: string, memoryFile: MemoryFile): void {
  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 更新时间戳
  memoryFile.updated = new Date().toISOString();
  
  // 写入文件
  const content = JSON.stringify(memoryFile, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}

export function registerSaveMemoryTool(server: McpServer, workspacePath: string): void {
  server.tool(
    'save_memory',
    'Saves information to long-term memory for later retrieval. Memories are organized by category and can be tagged for easy searching.',
    saveMemorySchema.shape,
    async ({ content, category, title, tags, append }) => {
      const config = getConfig();
      
      try {
        // 验证输入
        if (!content.trim()) {
          throw new FileToolError(
            'Memory content cannot be empty',
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 清理和验证 category
        const cleanCategory = category.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        if (!cleanCategory) {
          throw new FileToolError(
            'Invalid category name',
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 获取内存文件路径
        const memoryFilePath = getMemoryFilePath(workspacePath, cleanCategory);
        
        // 加载现有内存文件
        const memoryFile = await withTimeout(
          () => Promise.resolve(loadMemoryFile(memoryFilePath)),
          config.fileOperationTimeout,
          'Memory file load operation timed out'
        );
        
        if (append && memoryFile.entries.length > 0) {
          // 追加到最后一个条目
          const lastEntry = memoryFile.entries[memoryFile.entries.length - 1];
          lastEntry.content += '\n\n' + content;
          lastEntry.tags = [...new Set([...lastEntry.tags, ...tags])]; // 合并标签并去重
          
          // 保存文件
          await withTimeout(
            () => Promise.resolve(saveMemoryFile(memoryFilePath, memoryFile)),
            config.fileOperationTimeout,
            'Memory file save operation timed out'
          );
          
          const relativePath = getRelativePathDisplay(memoryFilePath, workspacePath);
          
          return {
            content: [
              { type: 'text', text: `Memory appended to existing entry in category "${cleanCategory}"\nEntry ID: ${lastEntry.id}\nFile: ${relativePath}` }
            ],
            summary: `Appended memory to category "${cleanCategory}"`
          };
        } else {
          // 创建新条目
          const newEntry: MemoryEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            title,
            content,
            category: cleanCategory,
            tags,
          };
          
          memoryFile.entries.push(newEntry);
          
          // 保存文件
          await withTimeout(
            () => Promise.resolve(saveMemoryFile(memoryFilePath, memoryFile)),
            config.fileOperationTimeout,
            'Memory file save operation timed out'
          );
          
          const relativePath = getRelativePathDisplay(memoryFilePath, workspacePath);
          
          // 生成显示信息
          const output = [
            `Memory saved successfully!`,
            `Category: ${cleanCategory}`,
            `Entry ID: ${newEntry.id}`,
            `File: ${relativePath}`,
          ];
          
          if (title) {
            output.splice(2, 0, `Title: ${title}`);
          }
          
          if (tags.length > 0) {
            output.push(`Tags: ${tags.join(', ')}`);
          }
          
          output.push('');
          output.push('Content preview:');
          output.push(content.length > 200 ? content.substring(0, 200) + '...' : content);
          
          return {
            content: [
              { type: 'text', text: output.join('\n') }
            ],
            summary: `Saved memory to category "${cleanCategory}" (${newEntry.id})`
          };
        }
        
      } catch (error) {
        const errorMessage = error instanceof FileToolError 
          ? error.message 
          : `Failed to save memory: ${error}`;
          
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