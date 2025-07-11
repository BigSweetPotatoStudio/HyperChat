import { describe, it, expect } from 'vitest';

/**
 * 测试是否能够成功导入 workspace 模块
 * 这个测试验证 Vitest 是否能正确处理 .mjs 文件
 */
describe('工作区模块导入测试', () => {
  it('应该能够导入 workspace 模块', async () => {
    // 动态导入以确保模块加载成功
    const workspaceModule = await import('@hyperchat/shared/workspace');
    
    expect(workspaceModule).toBeDefined();
    expect(typeof workspaceModule).toBe('object');
  });

  it('应该能够访问导出的类', async () => {
    const { 
      DataList, 
      AgentInstance, 
      AgentManager, 
      Workspace, 
      WorkspaceManager, 
      Data 
    } = await import('@hyperchat/shared/workspace');
    
    // 验证所有主要类都被导出
    expect(DataList).toBeDefined();
    expect(AgentInstance).toBeDefined();
    expect(AgentManager).toBeDefined();
    expect(Workspace).toBeDefined();
    expect(WorkspaceManager).toBeDefined();
    expect(Data).toBeDefined();
    
    // 验证它们都是构造函数
    expect(typeof DataList).toBe('function');
    expect(typeof AgentInstance).toBe('function');
    expect(typeof AgentManager).toBe('function');
    expect(typeof Workspace).toBe('function');
    expect(typeof WorkspaceManager).toBe('function');
    expect(typeof Data).toBe('function');
  });
});