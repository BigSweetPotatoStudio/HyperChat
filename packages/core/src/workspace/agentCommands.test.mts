/**
 * Agent命令系统测试
 * 
 * 测试Agent自定义命令的完整功能
 */
import { AgentCommandManager, parseCommandInput } from './agentCommands.mjs';
import path from 'path';

// 测试Agent命令管理器
async function testAgentCommandManager() {
  console.log('🧪 测试Agent命令管理器\n');
  
  const testAgentPath = '/home/laop/projects/HyperChat/test-agent';
  const commandManager = new AgentCommandManager(testAgentPath);
  
  // 测试加载命令
  console.log('1️⃣ 测试加载命令');
  await commandManager.loadCommands();
  
  const commands = await commandManager.getAllCommands();
  console.log(`✅ 加载到 ${commands.length} 个命令:`);
  commands.forEach(cmd => {
    console.log(`   📄 ${cmd.name}: ${cmd.content.split('\n')[0].substring(0, 50)}...`);
  });
  
  // 测试命令执行
  console.log('\n2️⃣ 测试命令执行');
  const testCommand = 'bug-fix';
  const testArgs = '@./src/index.ts 登录功能有问题';
  
  const result = commandManager.executeCommand(testCommand, testArgs);
  if (result) {
    console.log('✅ 命令执行成功');
    console.log('🔄 替换结果:');
    console.log(result);
  } else {
    console.log('❌ 命令执行失败');
  }
  
  // 测试命令不存在的情况
  console.log('\n3️⃣ 测试不存在的命令');
  const nonExistentResult = commandManager.executeCommand('non-existent', 'test');
  console.log(`❓ 不存在命令结果: ${nonExistentResult === null ? 'null (正确)' : '错误'}`);
}

// 测试命令解析
function testCommandParsing() {
  console.log('\n🧪 测试命令解析\n');
  
  const testCases = [
    '/bug-fix src/index.ts 有问题',
    '/review',
    'not a command',
    '/test @./src/utils.ts',
    '/optimize 这是一段需要优化的代码'
  ];
  
  testCases.forEach((input, index) => {
    console.log(`${index + 1}️⃣ 解析输入: "${input}"`);
    const parsed = parseCommandInput(input);
    if (parsed) {
      console.log(`   ✅ 命令: "${parsed.command}", 参数: "${parsed.args}"`);
    } else {
      console.log(`   ❌ 不是命令格式`);
    }
    console.log('');
  });
}

// 测试完整的命令替换流程
function testCommandReplacement() {
  console.log('🧪 测试完整命令替换流程\n');
  
  const testCases = [
    {
      command: 'bug-fix',
      args: '@./src/login.ts 用户登录后跳转不正确',
      expected: '请帮我修复以下代码中的bug：\n\n@./src/login.ts 用户登录后跳转不正确'
    },
    {
      command: 'review',
      args: '@./src/utils/auth.js',
      expected: '请对以下代码进行全面的code review：\n\n@./src/utils/auth.js'
    },
    {
      command: 'explain',
      args: '这是一个复杂的算法实现',
      expected: '请详细解释以下代码的功能和实现：\n\n这是一个复杂的算法实现'
    }
  ];
  
  const testAgentPath = '/home/laop/projects/HyperChat/test-agent';
  const commandManager = new AgentCommandManager(testAgentPath);
  
  testCases.forEach(async (testCase, index) => {
    console.log(`${index + 1}️⃣ 测试命令: /${testCase.command}`);
    console.log(`   参数: ${testCase.args}`);
    
    try {
      await commandManager.loadCommands();
      const result = commandManager.executeCommand(testCase.command, testCase.args);
      
      if (result && result.includes(testCase.args)) {
        console.log('   ✅ 替换成功');
        console.log(`   📝 结果长度: ${result.length} 字符`);
      } else {
        console.log('   ❌ 替换失败');
        console.log(`   📝 实际结果: ${result?.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ 执行错误: ${error}`);
    }
    console.log('');
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始Agent命令系统功能测试\n');
  console.log('='.repeat(50));
  
  try {
    await testAgentCommandManager();
    console.log('\n' + '='.repeat(50));
    
    testCommandParsing();
    console.log('='.repeat(50));
    
    testCommandReplacement();
    console.log('\n='.repeat(50));
    
    console.log('\n✅ 所有测试完成');
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
  }
}

// 执行测试
runAllTests();