import fs from 'fs';
import path from 'path';
import os from 'os';

// 文件建议类型
export interface FileSuggestion {
  type: 'file' | 'directory';
  name: string;
  fullPath: string;
  displayName: string;
  relativePath: string;
}

// 解析路径，支持相对路径、绝对路径、~家目录
export function resolvePath(inputPath: string, currentWorkingDir: string = process.cwd()): string {
  if (inputPath.startsWith('~')) {
    return path.resolve(os.homedir(), inputPath.slice(2));
  }
  
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  
  return path.resolve(currentWorkingDir, inputPath);
}

// 获取目录下的文件和文件夹建议
export async function getFilePathSuggestions(
  inputPath: string, 
  currentWorkingDir: string = process.cwd(),
  maxSuggestions: number = 10
): Promise<FileSuggestion[]> {
  try {
    // 如果输入为空（只有@符号），显示当前目录内容
    if (inputPath === '') {
      const dirPath = currentWorkingDir;
      const fileName = '';
      
      return await getDirectoryContents(dirPath, fileName, currentWorkingDir, maxSuggestions);
    }
    
    // 解析输入路径
    const resolvedPath = resolvePath(inputPath, currentWorkingDir);
    
    // 检查输入是否以/结尾，表示用户想要进入该目录
    if (inputPath.endsWith('/') || inputPath.endsWith('\\')) {
      // 用户想要查看该目录的内容
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        return await getDirectoryContents(resolvedPath, '', currentWorkingDir, maxSuggestions);
      } else {
        return [];
      }
    } else {
      // 用户在输入文件/文件夹名，进行匹配
      const dirPath = path.dirname(resolvedPath);
      const fileName = path.basename(resolvedPath);
      
      // 检查目录是否存在
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      
      return await getDirectoryContents(dirPath, fileName, currentWorkingDir, maxSuggestions);
    }
  } catch (error) {
    // 权限问题或其他错误，返回空数组
    console.warn('Error reading directory:', error);
    return [];
  }
}

// 获取目录内容的辅助函数
async function getDirectoryContents(
  dirPath: string,
  fileName: string,
  currentWorkingDir: string,
  maxSuggestions: number
): Promise<FileSuggestion[]> {
  // 读取目录内容
  const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
  // 过滤和排序
  const suggestions: FileSuggestion[] = [];
  
  for (const item of items) {
    // 跳过隐藏文件（以.开头），除非用户明确输入了.
    if (item.name.startsWith('.') && !fileName.startsWith('.')) {
      continue;
    }
    
    // 如果有文件名前缀，进行过滤
    if (fileName && !item.name.toLowerCase().startsWith(fileName.toLowerCase())) {
      continue;
    }
    
    const fullPath = path.join(dirPath, item.name);
    let relativePath: string;
    
    // 如果是当前目录且没有前缀，直接显示文件名
    if (dirPath === currentWorkingDir && fileName === '') {
      relativePath = item.name;
    } else {
      const relPath = path.relative(currentWorkingDir, fullPath);
      relativePath = relPath.startsWith('..') ? fullPath : `./${relPath}`;
    }
    
    const suggestion: FileSuggestion = {
      type: item.isDirectory() ? 'directory' : 'file',
      name: item.name,
      fullPath,
      displayName: item.isDirectory() ? `📁 ${item.name}/` : `📄 ${item.name}`,
      relativePath
    };
    
    suggestions.push(suggestion);
    
    // 限制建议数量
    if (suggestions.length >= maxSuggestions) {
      break;
    }
  }
  
  // 排序：文件夹在前，然后按名称排序
  suggestions.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return suggestions;
}

// 从输入中提取文件路径部分（支持多个@符号）
export function extractFilePathFromInput(input: string, cursorPosition?: number): string | null {
  // 找到所有@符号位置
  const atMatches = [...input.matchAll(/@([^\s]*)/g)];
  
  if (atMatches.length === 0) {
    return null;
  }
  
  // 如果没有光标位置，返回最后一个@路径（兼容原有行为）
  if (cursorPosition === undefined) {
    const lastMatch = atMatches[atMatches.length - 1];
    return lastMatch[1] || '';
  }
  
  // 根据光标位置找到对应的@路径
  for (const match of atMatches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;
    
    // 光标在这个@路径范围内
    if (cursorPosition >= matchStart && cursorPosition <= matchEnd) {
      return match[1] || '';
    }
  }
  
  // 如果光标不在任何@路径内，检查是否在@符号后紧邻位置
  for (const match of atMatches) {
    const matchEnd = match.index! + match[0].length;
    if (cursorPosition === matchEnd) {
      return match[1] || '';
    }
  }
  
  return null;
}

// 构建完整的输入，替换文件路径部分（支持多个@符号）
export function buildInputWithFilePath(originalInput: string, newPath: string, cursorPosition?: number): string {
  // 找到所有@符号位置
  const atMatches = [...originalInput.matchAll(/@([^\s]*)/g)];
  
  if (atMatches.length === 0) {
    return originalInput;
  }
  
  // 如果没有光标位置，替换最后一个@路径（兼容原有行为）
  if (cursorPosition === undefined) {
    const lastMatch = atMatches[atMatches.length - 1];
    const matchStart = lastMatch.index!;
    const matchEnd = matchStart + lastMatch[0].length;
    return originalInput.substring(0, matchStart) + `@${newPath}` + originalInput.substring(matchEnd);
  }
  
  // 根据光标位置找到要替换的@路径
  for (const match of atMatches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;
    
    // 光标在这个@路径范围内或紧邻位置
    if ((cursorPosition >= matchStart && cursorPosition <= matchEnd) || cursorPosition === matchEnd) {
      return originalInput.substring(0, matchStart) + `@${newPath}` + originalInput.substring(matchEnd);
    }
  }
  
  // 如果找不到匹配的@路径，返回原输入
  return originalInput;
}

// 判断路径是否为文件夹（以/结尾或确实是文件夹）
export function isDirectoryPath(filePath: string): boolean {
  if (filePath.endsWith('/') || filePath.endsWith('\\')) {
    return true;
  }
  
  try {
    const resolvedPath = resolvePath(filePath);
    if (fs.existsSync(resolvedPath)) {
      return fs.statSync(resolvedPath).isDirectory();
    }
  } catch {
    // 忽略错误
  }
  
  return false;
}

// 获取所有@符号的位置信息
export interface AtSymbolInfo {
  index: number;           // @符号在输入中的位置
  pathPart: string;        // @后面的路径部分
  fullMatch: string;       // 完整匹配（@路径）
  matchStart: number;      // 匹配开始位置
  matchEnd: number;        // 匹配结束位置
}

export function getAllAtSymbolsInfo(input: string): AtSymbolInfo[] {
  const atMatches = [...input.matchAll(/@([^\s]*)/g)];
  
  return atMatches.map(match => ({
    index: match.index!,
    pathPart: match[1] || '',
    fullMatch: match[0],
    matchStart: match.index!,
    matchEnd: match.index! + match[0].length
  }));
}

// 根据光标位置获取当前@符号信息
export function getCurrentAtSymbolInfo(input: string, cursorPosition: number): AtSymbolInfo | null {
  const allAtSymbols = getAllAtSymbolsInfo(input);
  
  for (const atInfo of allAtSymbols) {
    // 光标在这个@路径范围内或紧邻位置
    if ((cursorPosition >= atInfo.matchStart && cursorPosition <= atInfo.matchEnd) || 
        cursorPosition === atInfo.matchEnd) {
      return atInfo;
    }
  }
  
  return null;
}