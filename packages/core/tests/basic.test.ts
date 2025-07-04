import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// 基础测试，不导入目标模块
describe('基础测试', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'hyperchat-basic-test', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('应该能够创建和管理文件系统', () => {
    expect(fs.existsSync(tempDir)).toBe(true);
    
    const testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    
    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.readFileSync(testFile, 'utf-8')).toBe('test content');
  });

  it('应该能够处理JSON数据', () => {
    const testData = {
      name: 'test-agent',
      key: 'agent-123',
      prompt: 'You are a test agent.',
      allowMCPs: ['test-mcp'],
      confirm_call_tool: false,
      created: Date.now(),
      lastModified: Date.now(),
    };

    const testFile = path.join(tempDir, 'agent.json');
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

    const loadedData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
    expect(loadedData).toEqual(testData);
  });

  it('应该能够创建目录结构', async () => {
    const agentsDir = path.join(tempDir, 'agents');
    const agent1Dir = path.join(agentsDir, 'agent1');
    const chatLogsDir = path.join(agent1Dir, 'chatlogs');

    await fs.promises.mkdir(chatLogsDir, { recursive: true });

    expect(fs.existsSync(agentsDir)).toBe(true);
    expect(fs.existsSync(agent1Dir)).toBe(true);
    expect(fs.existsSync(chatLogsDir)).toBe(true);
  });

  it('应该能够扫描目录', async () => {
    // 创建测试目录结构
    const subDir1 = path.join(tempDir, 'subdir1');
    const subDir2 = path.join(tempDir, 'subdir2');
    
    await fs.promises.mkdir(subDir1);
    await fs.promises.mkdir(subDir2);
    
    await fs.promises.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
    await fs.promises.writeFile(path.join(subDir1, 'file2.json'), '{}');
    await fs.promises.writeFile(path.join(subDir2, 'file3.md'), '# Test');

    const entries = await fs.promises.readdir(tempDir, { withFileTypes: true });
    
    expect(entries).toHaveLength(3);
    
    const dirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    const files = entries.filter(entry => entry.isFile()).map(entry => entry.name);
    
    expect(dirs).toContain('subdir1');
    expect(dirs).toContain('subdir2');
    expect(files).toContain('file1.txt');
  });

  it('应该能够处理并发文件操作', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      fs.promises.writeFile(
        path.join(tempDir, `file${i}.txt`),
        `content ${i}`
      )
    );

    await Promise.all(operations);

    // 验证所有文件都被创建
    for (let i = 0; i < 10; i++) {
      const filePath = path.join(tempDir, `file${i}.txt`);
      expect(fs.existsSync(filePath)).toBe(true);
      
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe(`content ${i}`);
    }
  });

  it('应该能够处理错误情况', async () => {
    const nonExistentFile = path.join(tempDir, 'non-existent.txt');
    
    expect(() => {
      fs.readFileSync(nonExistentFile);
    }).toThrow();

    expect(fs.existsSync(nonExistentFile)).toBe(false);
  });

  it('应该能够处理复杂的数据结构', () => {
    const complexData = {
      workspace: {
        key: 'workspace-123',
        name: 'Test Workspace',
        path: tempDir,
        settings: {
          enableMCP: true,
          enableAgents: true,
          autoSave: true,
        },
        agents: [
          {
            key: 'agent1',
            name: 'Agent 1',
            chatLogs: [
              {
                key: 'chat1',
                messages: [
                  { role: 'user', content: 'Hello' },
                  { role: 'assistant', content: 'Hi there!' }
                ]
              }
            ]
          }
        ]
      }
    };

    const dataFile = path.join(tempDir, 'complex-data.json');
    fs.writeFileSync(dataFile, JSON.stringify(complexData, null, 2));

    const loaded = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    expect(loaded).toEqual(complexData);
    expect(loaded.workspace.agents).toHaveLength(1);
    expect(loaded.workspace.agents[0].chatLogs[0].messages).toHaveLength(2);
  });
});