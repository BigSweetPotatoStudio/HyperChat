import fs from 'fs';
import path from 'path';
import { FileToolError, ERROR_CODES, getConfig } from './lib.mjs';
import { workspaceManager } from '../../../lib.mjs';

/**
 * 验证文件扩展名是否允许
 */
export function validateFileExtension(filePath: string): void {
  const config = getConfig();
  const ext = path.extname(filePath).toLowerCase();

  // 检查是否在禁止列表中
  if (config.blockedExtensions.includes(ext)) {
    throw new FileToolError(
      `File extension '${ext}' is not allowed`,
      ERROR_CODES.EXTENSION_BLOCKED
    );
  }

  // 如果有允许列表，检查是否在允许列表中
  if (config.allowedExtensions.length > 0 && !config.allowedExtensions.includes(ext)) {
    throw new FileToolError(
      `File extension '${ext}' is not in the allowed list`,
      ERROR_CODES.EXTENSION_BLOCKED
    );
  }
}

/**
 * 验证文件大小
 */
export function validateFileSize(filePath: string): void {
  const config = getConfig();
  const stats = fs.statSync(filePath);

  if (stats.size > config.maxFileSize) {
    throw new FileToolError(
      `File size (${stats.size}) exceeds maximum allowed size (${config.maxFileSize})`,
      ERROR_CODES.FILE_TOO_LARGE
    );
  }
}

/**
 * 规范化文件路径
 */
export function normalizePath(filePath: string): string {
  return path.resolve(filePath);
}

/**
 * 读取文件内容（带分页支持）
 */
export function readFileContent(filePath: string, offset?: number, limit?: number): string {
  const content = fs.readFileSync(filePath, 'utf8');

  if (offset !== undefined || limit !== undefined) {
    const lines = content.split('\n');
    const startLine = offset || 0;
    const endLine = limit ? startLine + limit : lines.length;

    return lines.slice(startLine, endLine).join('\n');
  }

  return content;
}

/**
 * 限制输出行数
 */
export function limitOutputLines(content: string, maxLines?: number): string {
  const config = getConfig();
  const actualMaxLines = maxLines || config.maxOutputLines;

  const lines = content.split('\n');
  if (lines.length > actualMaxLines) {
    return lines.slice(0, actualMaxLines).join('\n') +
      `\n... (truncated, showing first ${actualMaxLines} lines of ${lines.length})`;
  }

  return content;
}


/**
 * 检查命令是否被允许
 */
export function validateCommand(command: string): void {
  const config = getConfig();
  const commandRoot = command.trim().split(/\s+/)[0];

  // 检查是否在禁止列表中
  if (config.blockedCommands.some(blocked => commandRoot.includes(blocked))) {
    throw new FileToolError(
      `Command '${commandRoot}' is not allowed`,
      ERROR_CODES.COMMAND_BLOCKED
    );
  }

  // 如果有允许列表，检查是否在允许列表中
  if (config.allowedCommands.length > 0 &&
    !config.allowedCommands.some(allowed => commandRoot.includes(allowed))) {
    throw new FileToolError(
      `Command '${commandRoot}' is not in the allowed list`,
      ERROR_CODES.COMMAND_BLOCKED
    );
  }
}

/**
 * 异步执行带超时控制的操作
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new FileToolError(errorMessage, ERROR_CODES.OPERATION_TIMEOUT));
    }, timeoutMs);

    operation()
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * 检查路径是否在 git 仓库中
 */
export function isInGitRepository(dirPath: string): boolean {
  let currentPath = path.resolve(dirPath);

  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return true;
    }
    currentPath = path.dirname(currentPath);
  }

  return false;
}

/**
 * 找到 git 仓库根目录
 */
export function findGitRoot(dirPath: string): string | null {
  let currentPath = path.resolve(dirPath);

  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * 解析 gitignore 规则
 */
function parseGitignoreRules(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      // 处理否定规则（以 ! 开头）
      if (line.startsWith('!')) {
        return line;
      }

      // 处理目录规则（以 / 结尾）
      if (line.endsWith('/')) {
        return line;
      }

      return line;
    });
}

/**
 * 检查路径是否匹配 gitignore 规则
 */
function matchesGitignoreRule(filePath: string, rule: string, gitRoot: string): boolean {
  // 获取相对于 git 根目录的路径，并标准化为 Unix 风格路径
  const relativePath = path.relative(gitRoot, filePath).replace(/\\/g, '/');

  // 处理否定规则
  if (rule.startsWith('!')) {
    return false; // 否定规则需要特殊处理，这里简化处理
  }

  // 标准化规则为 Unix 风格路径
  const normalizedRule = rule.replace(/\\/g, '/');

  // 处理以 / 开头的规则（根目录相对规则）
  if (normalizedRule.startsWith('/')) {
    const rootRule = normalizedRule.slice(1);
    if (rootRule.endsWith('/')) {
      const dirRule = rootRule.slice(0, -1);
      return relativePath === dirRule || relativePath.startsWith(dirRule + '/');
    }
    return relativePath === rootRule || relativePath.startsWith(rootRule + '/');
  }

  // 处理目录规则
  if (normalizedRule.endsWith('/')) {
    const dirRule = normalizedRule.slice(0, -1);

    // 检查完整路径匹配
    if (relativePath === dirRule || relativePath.startsWith(dirRule + '/')) {
      return true;
    }

    // 检查路径段匹配（对于不以 / 开头的规则）
    const pathSegments = relativePath.split('/');
    for (let i = 0; i < pathSegments.length; i++) {
      if (pathSegments[i] === dirRule) {
        return true;
      }
    }

    return false;
  }

  // 处理通配符匹配
  if (normalizedRule.includes('*')) {
    const regexPattern = normalizedRule
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');

    const regex = new RegExp(`^${regexPattern}$`);

    // 检查完整路径匹配
    if (regex.test(relativePath)) {
      return true;
    }

    // 检查文件名匹配
    const fileName = path.basename(filePath);
    const fileNameRegex = new RegExp(`^${normalizedRule.replace(/\./g, '\\.').replace(/\*/g, '[^/]*')}$`);
    if (fileNameRegex.test(fileName)) {
      return true;
    }

    // 检查路径段匹配
    const pathSegments = relativePath.split('/');
    for (const segment of pathSegments) {
      if (fileNameRegex.test(segment)) {
        return true;
      }
    }

    return false;
  }

  // 对于普通规则，检查是否是路径中的任何一个段
  const pathSegments = relativePath.split('/');
  for (const segment of pathSegments) {
    if (segment === normalizedRule) {
      return true;
    }
  }

  // 精确匹配或路径包含匹配
  return relativePath === normalizedRule ||
    relativePath.startsWith(normalizedRule + '/') ||
    path.basename(filePath) === normalizedRule;
}

/**
 * 加载指定目录的 gitignore 规则
 */
export function loadGitignoreRulesFromDir(dirPath: string): string[] {
  const gitignorePath = path.join(dirPath, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    return parseGitignoreRules(content);
  } catch (error) {
    console.warn(`Cannot read .gitignore file at ${gitignorePath}: ${error}`);
    return [];
  }
}

/**
 * 加载从当前目录到 git 根目录的所有 gitignore 规则
 */
export function loadAllGitignoreRules(currentPath: string, gitRoot: string): { rules: string[], sources: string[] } {
  const allRules: { rule: string, baseDir: string }[] = [];
  const sources: string[] = [];
  let currentDir = path.resolve(currentPath);
  const rootDir = path.resolve(gitRoot);

  // 从当前目录向上遍历到 git 根目录
  while (currentDir.startsWith(rootDir)) {
    const rules = loadGitignoreRulesFromDir(currentDir);
    if (rules.length > 0) {
      // 为每个规则记录其基础目录
      rules.forEach(rule => {
        allRules.push({ rule, baseDir: currentDir });
      });
      sources.push(path.join(currentDir, '.gitignore'));
    }

    // 如果已经到达 git 根目录，停止
    if (currentDir === rootDir) {
      break;
    }

    currentDir = path.dirname(currentDir);
  }

  return {
    rules: allRules.map(({ rule, baseDir }) => {
      // 如果规则以 / 开头，它是相对于包含 .gitignore 的目录的
      if (rule.startsWith('/')) {
        const relativeBaseDir = path.relative(gitRoot, baseDir).replace(/\\/g, '/');
        if (relativeBaseDir) {
          return relativeBaseDir + rule; // 例如: packages/core + /node_modules = packages/core/node_modules
        } else {
          return rule; // 在根目录，保持原样
        }
      }
      return rule; // 不以 / 开头的规则保持原样
    }),
    sources
  };
}

/**
 * 检查文件是否应该被 gitignore 忽略
 */
export function shouldIgnoreFile(filePath: string, gitRoot: string, gitignoreRules: string[]): boolean {
  // 总是忽略 .git 目录
  if (filePath.includes('/.git/') || filePath.endsWith('/.git')) {
    return true;
  }

  // 检查 gitignore 规则
  for (const rule of gitignoreRules) {
    if (matchesGitignoreRule(filePath, rule, gitRoot)) {
      // 添加调试信息，帮助诊断问题
      const relativePath = path.relative(gitRoot, filePath);
      console.log(`File ignored by gitignore: ${relativePath} (rule: ${rule})`);
      return true;
    }
  }

  return false;
}