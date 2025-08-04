/**
 * 多@符号文件路径功能测试
 * 
 * 测试新实现的多@符号支持功能
 */
import { 
  extractFilePathFromInput, 
  buildInputWithFilePath,
  getAllAtSymbolsInfo,
  getCurrentAtSymbolInfo,
  type AtSymbolInfo
} from './FilePathUtils.js';

// 测试数据
const testCases = [
  {
    name: '单个@符号 - 基本功能',
    input: '分析 @./src/index.ts 文件',
    cursorPos: 15, // 在 @./src/index.ts 内
    expectedPath: './src/index.ts',
    expectedAtInfo: {
      index: 3,
      pathPart: './src/index.ts',
      fullMatch: '@./src/index.ts',
      matchStart: 3,
      matchEnd: 18
    }
  },
  {
    name: '多个@符号 - 第一个',
    input: '比较 @./src/ 和 @./docs/ 的结构',
    cursorPos: 8, // 在第一个@路径内
    expectedPath: './src/',
    expectedAtInfo: {
      index: 3,
      pathPart: './src/',
      fullMatch: '@./src/',
      matchStart: 3,
      matchEnd: 10
    }
  },
  {
    name: '多个@符号 - 第二个',
    input: '比较 @./src/ 和 @./docs/ 的结构',
    cursorPos: 20, // 在第二个@路径内
    expectedPath: './docs/',
    expectedAtInfo: {
      index: 13,  // 修正：第二个@符号的实际位置
      pathPart: './docs/',
      fullMatch: '@./docs/',
      matchStart: 13,
      matchEnd: 21
    }
  },
  {
    name: '空@符号',  
    input: '查看 @ 当前目录',
    cursorPos: 4, // 在@符号位置
    expectedPath: '',
    expectedAtInfo: {
      index: 3,
      pathPart: '',
      fullMatch: '@',
      matchStart: 3,
      matchEnd: 4
    }
  }
];

// 运行测试
console.log('🧪 开始测试多@符号文件路径功能\n');

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: "${testCase.input}"`);
  console.log(`光标位置: ${testCase.cursorPos}`);
  
  // 测试 extractFilePathFromInput
  const extractedPath = extractFilePathFromInput(testCase.input, testCase.cursorPos);
  const pathMatch = extractedPath === testCase.expectedPath;
  console.log(`📁 路径提取: ${extractedPath} ${pathMatch ? '✅' : '❌'}`);
  
  // 测试 getCurrentAtSymbolInfo
  const atInfo = getCurrentAtSymbolInfo(testCase.input, testCase.cursorPos);
  const atInfoMatch = atInfo && 
    atInfo.index === testCase.expectedAtInfo.index &&
    atInfo.pathPart === testCase.expectedAtInfo.pathPart &&
    atInfo.fullMatch === testCase.expectedAtInfo.fullMatch;
  console.log(`🎯 @符号信息: ${atInfoMatch ? '✅' : '❌'}`);
  
  if (atInfo) {
    console.log(`    位置: ${atInfo.matchStart}-${atInfo.matchEnd}, 路径: "${atInfo.pathPart}"`);
  }
  
  // 测试 buildInputWithFilePath
  const newInput = buildInputWithFilePath(testCase.input, 'newpath.txt', testCase.cursorPos);
  const expectedNewInput = testCase.input.substring(0, testCase.expectedAtInfo.matchStart) + 
    '@newpath.txt' + 
    testCase.input.substring(testCase.expectedAtInfo.matchEnd);
  const buildMatch = newInput === expectedNewInput;
  console.log(`🔧 路径替换: ${buildMatch ? '✅' : '❌'}`);
  console.log(`    结果: "${newInput}"`);
  
  console.log('');
});

// 测试 getAllAtSymbolsInfo
console.log('🔍 测试获取所有@符号信息');
const multiAtInput = '分析 @./src/index.ts 和 @./docs/README.md 以及 @package.json';
const allAtInfo = getAllAtSymbolsInfo(multiAtInput);
console.log(`发现 ${allAtInfo.length} 个@符号:`);
allAtInfo.forEach((atInfo, index) => {
  console.log(`  ${index + 1}. ${atInfo.fullMatch} (位置: ${atInfo.matchStart}-${atInfo.matchEnd})`);
});

console.log('\n✅ 多@符号功能测试完成');

// 兼容性测试 - 确保原有单@符号功能仍然正常
console.log('\n🔄 向后兼容性测试');
const legacyInput = '查看 @./src/components/ 文件夹';
const legacyPath = extractFilePathFromInput(legacyInput); // 不传光标位置
const legacyExpected = './src/components/';
console.log(`原有单@功能: ${legacyPath === legacyExpected ? '✅' : '❌'}`);
console.log(`提取路径: "${legacyPath}"`);