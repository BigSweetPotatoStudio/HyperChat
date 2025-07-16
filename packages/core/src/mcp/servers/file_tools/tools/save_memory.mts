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
  fact: z.string().describe('The specific fact or piece of information to remember. Should be a clear, self-contained statement.'),
  memoryPath: z.string().describe('Custom path to the memory file. If not provided, uses default workspace memory file.'),
});

const DEFAULT_MEMORY_FILENAME = 'HYPERCHAT.md';
const MEMORY_SECTION_HEADER = '## HyperChat Added Memories';

function getDefaultMemoryFilePath(workspacePath: string): string {
  return path.join(workspacePath, '.hyperchat', DEFAULT_MEMORY_FILENAME);
}

/**
 * Ensures proper newline separation before appending content.
 */
function ensureNewlineSeparation(currentContent: string): string {
  if (currentContent.length === 0) return '';
  if (currentContent.endsWith('\n\n') || currentContent.endsWith('\r\n\r\n'))
    return '';
  if (currentContent.endsWith('\n') || currentContent.endsWith('\r\n'))
    return '\n';
  return '\n\n';
}

/**
 * Adds a memory entry to the specified Markdown file.
 */
async function performAddMemoryEntry(
  fact: string,
  memoryFilePath: string,
  fsAdapter: {
    readFile: (path: string, encoding: 'utf-8') => Promise<string>;
    writeFile: (path: string, data: string, encoding: 'utf-8') => Promise<void>;
    mkdir: (path: string, options: { recursive: boolean }) => Promise<string | undefined>;
  },
): Promise<void> {
  let processedFact = fact.trim();
  // Remove leading hyphens and spaces that might be misinterpreted as markdown list items
  processedFact = processedFact.replace(/^(-+\s*)+/, '').trim();
  const newMemoryItem = `- ${processedFact}`;

  try {
    await fsAdapter.mkdir(path.dirname(memoryFilePath), { recursive: true });
    let content = '';
    try {
      content = await fsAdapter.readFile(memoryFilePath, 'utf-8');
    } catch (_e) {
      // File doesn't exist, will be created with header and item.
    }

    const headerIndex = content.indexOf(MEMORY_SECTION_HEADER);

    if (headerIndex === -1) {
      // Header not found, append header and then the entry
      const separator = ensureNewlineSeparation(content);
      content += `${separator}${MEMORY_SECTION_HEADER}\n${newMemoryItem}\n`;
    } else {
      // Header found, find where to insert the new memory entry
      const startOfSectionContent = headerIndex + MEMORY_SECTION_HEADER.length;
      let endOfSectionIndex = content.indexOf('\n## ', startOfSectionContent);
      if (endOfSectionIndex === -1) {
        endOfSectionIndex = content.length; // End of file
      }

      const beforeSectionMarker = content
        .substring(0, startOfSectionContent)
        .trimEnd();
      let sectionContent = content
        .substring(startOfSectionContent, endOfSectionIndex)
        .trimEnd();
      const afterSectionMarker = content.substring(endOfSectionIndex);

      sectionContent += `\n${newMemoryItem}`;
      content =
        `${beforeSectionMarker}\n${sectionContent.trimStart()}\n${afterSectionMarker}`.trimEnd() +
        '\n';
    }
    await fsAdapter.writeFile(memoryFilePath, content, 'utf-8');
  } catch (error) {
    console.error(
      `[SaveMemoryTool] Error adding memory entry to ${memoryFilePath}:`,
      error,
    );
    throw new Error(
      `[SaveMemoryTool] Failed to add memory entry: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function registerSaveMemoryTool(server: McpServer, workspacePath: string, globalPath?: string): void {
  server.tool(
    'save_memory',
    'Saves a specific piece of information or fact to your long-term memory. Use this when the user explicitly asks you to remember something, or when they state a clear, concise fact that seems important to retain for future interactions.',
    saveMemorySchema.shape,
    async ({ fact, memoryPath }) => {
      const config = getConfig();
      
      try {
        // 验证输入
        if (!fact || typeof fact !== 'string' || fact.trim() === '') {
          throw new FileToolError(
            'Parameter "fact" must be a non-empty string',
            ERROR_CODES.INVALID_PATH
          );
        }
        
        // 确定内存文件路径
        const memoryFilePath = memoryPath 
          ? path.resolve(memoryPath)
          : getDefaultMemoryFilePath(workspacePath);
        
        // 添加内存条目
        await withTimeout(
          () => performAddMemoryEntry(fact, memoryFilePath, {
            readFile: (filePath, encoding) => fs.promises.readFile(filePath, encoding),
            writeFile: (filePath, data, encoding) => fs.promises.writeFile(filePath, data, encoding),
            mkdir: (dirPath, options) => fs.promises.mkdir(dirPath, options),
          }),
          config.fileOperationTimeout,
          'Memory save operation timed out'
        );
        
        // const relativePath = getRelativePathDisplay(memoryFilePath, workspacePath, globalPath);
        const successMessage = `Okay, I've remembered that: "${fact}"`;
        
        return {
          content: [
            { type: 'text', text: `${successMessage}\n\nSaved to: ${memoryPath}` }
          ],
          summary: `Saved memory: "${fact.length > 50 ? fact.substring(0, 50) + '...' : fact}"`
        };
        
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