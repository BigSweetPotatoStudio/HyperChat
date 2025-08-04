/**
 * Agent 命令管理器
 * 
 * 负责加载和管理 Agent 的自定义命令
 * 命令存储在 agentPath/commands/*.md 文件中
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface AgentCommand {
  name: string;           // 命令名称（不含/前缀）
  content: string;        // 命令内容（Markdown模板）
  filePath: string;       // 命令文件路径
}

export class AgentCommandManager {
  private commands: Map<string, AgentCommand> = new Map();
  private commandsPath: string;
  private isLoaded: boolean = false;

  constructor(private agentPath: string) {
    this.commandsPath = path.join(agentPath, 'commands');
  }

  /**
   * 加载所有命令
   */
  async loadCommands(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    this.commands.clear();

    try {
      // 检查 commands 目录是否存在
      const commandsDirExists = await this.directoryExists(this.commandsPath);
      if (!commandsDirExists) {
        // 目录不存在，没有自定义命令
        this.isLoaded = true;
        return;
      }

      // 读取目录中的所有文件
      const files = await readdir(this.commandsPath);
      
      // 过滤并处理 .md 文件
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.commandsPath, file);
          const fileStat = await stat(filePath);
          
          if (fileStat.isFile()) {
            // 命令名称为文件名（不含扩展名）
            const commandName = path.basename(file, '.md');
            
            // 读取文件内容
            const content = await readFile(filePath, 'utf-8');
            
            // 存储命令
            this.commands.set(commandName, {
              name: commandName,
              content: content.trim(),
              filePath
            });
          }
        }
      }

      this.isLoaded = true;
    } catch (error) {
      // 静默处理错误，命令功能是可选的
      console.warn(`Failed to load commands from ${this.commandsPath}:`, error);
      this.isLoaded = true;
    }
  }

  /**
   * 获取所有命令
   */
  async getAllCommands(): Promise<AgentCommand[]> {
    if (!this.isLoaded) {
      await this.loadCommands();
    }
    return Array.from(this.commands.values());
  }

  /**
   * 获取命令名称列表
   */
  async getCommandNames(): Promise<string[]> {
    if (!this.isLoaded) {
      await this.loadCommands();
    }
    return Array.from(this.commands.keys());
  }

  /**
   * 获取特定命令
   */
  async getCommand(name: string): Promise<AgentCommand | undefined> {
    if (!this.isLoaded) {
      await this.loadCommands();
    }
    return this.commands.get(name);
  }

  /**
   * 执行命令替换
   * 将命令模板中的 $ARG 替换为实际参数
   */
  executeCommand(commandName: string, args: string): string | null {
    const command = this.commands.get(commandName);
    if (!command) {
      return null;
    }

    // 替换 $ARG 占位符
    return command.content.replace(/\$ARG/g, args.trim());
  }

  /**
   * 检查命令是否存在
   */
  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }

  /**
   * 重新加载命令（用于命令文件更新后）
   */
  async reloadCommands(): Promise<void> {
    this.isLoaded = false;
    await this.loadCommands();
  }

  /**
   * 检查目录是否存在
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const dirStat = await stat(dirPath);
      return dirStat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 创建 commands 目录（如果不存在）
   */
  async ensureCommandsDirectory(): Promise<void> {
    if (!(await this.directoryExists(this.commandsPath))) {
      await promisify(fs.mkdir)(this.commandsPath, { recursive: true });
    }
  }

  /**
   * 创建示例命令文件
   */
  async createExampleCommands(): Promise<void> {
    await this.ensureCommandsDirectory();

    const examples = [
      {
        name: 'bug-fix',
        content: `请帮我修复以下代码中的bug：

$ARG

要求：
1. 分析问题原因
2. 提供修复方案  
3. 给出修复后的代码
4. 解释修复的原理`
      },
      {
        name: 'review',
        content: `请对以下代码进行code review：

$ARG

重点关注：
- 代码质量和可读性
- 潜在的性能问题
- 安全隐患
- 是否遵循最佳实践
- 改进建议`
      },
      {
        name: 'explain',
        content: `请详细解释以下代码的功能：

$ARG

要求：
1. 整体功能说明
2. 关键逻辑解析
3. 输入输出说明
4. 使用场景举例`
      },
      {
        name: 'test',
        content: `请为以下代码编写测试用例：

$ARG

要求：
1. 单元测试覆盖主要功能
2. 边界条件测试
3. 异常情况处理测试
4. 提供可运行的测试代码`
      },
      {
        name: 'optimize',
        content: `请优化以下代码：

$ARG

优化方向：
1. 性能优化
2. 代码简洁性
3. 可维护性
4. 错误处理
5. 提供优化前后对比`
      }
    ];

    for (const example of examples) {
      const filePath = path.join(this.commandsPath, `${example.name}.md`);
      
      // 只创建不存在的文件，避免覆盖用户修改
      try {
        await stat(filePath);
        // 文件已存在，跳过
      } catch {
        // 文件不存在，创建
        await promisify(fs.writeFile)(filePath, example.content, 'utf-8');
      }
    }
  }
}

/**
 * 解析命令输入
 * 返回命令名和参数
 */
export function parseCommandInput(input: string): { command: string; args: string } | null {
  // 检查是否以 / 开头
  if (!input.startsWith('/')) {
    return null;
  }

  // 提取命令和参数
  const spaceIndex = input.indexOf(' ');
  if (spaceIndex === -1) {
    // 只有命令，没有参数
    return {
      command: input.substring(1),
      args: ''
    };
  }

  return {
    command: input.substring(1, spaceIndex),
    args: input.substring(spaceIndex + 1)
  };
}

/**
 * 格式化命令为显示格式
 */
export function formatCommandForDisplay(command: AgentCommand): string {
  // 提取第一行作为描述
  const firstLine = command.content.split('\n')[0];
  const description = firstLine.replace(/^[#\s]+/, '').substring(0, 50);
  
  return `/${command.name} - ${description}${firstLine.length > 50 ? '...' : ''}`;
}