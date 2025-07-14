#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 需要扫描的目录
const SCAN_DIRS = [
  'packages/web/src',
  'packages/core/src',
  'packages/shared/src'
];

// 需要扫描的文件扩展名
const FILE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx'];

// 提取 t`...` 的正则表达式
const T_REGEX = /\bt`([^`]*)`/g;

// 存储所有找到的文本
const foundTexts = new Set();

/**
 * 递归扫描目录获取所有文件
 */
function getAllFiles(dir, fileList = []) {
  const fullPath = join(rootDir, dir);
  
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  目录不存在: ${fullPath}`);
    return fileList;
  }

  const files = readdirSync(fullPath);
  
  files.forEach(file => {
    const filePath = join(fullPath, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules, dist, build 等目录
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        getAllFiles(join(dir, file), fileList);
      }
    } else {
      // 只处理指定扩展名的文件
      if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
        fileList.push(join(dir, file));
      }
    }
  });
  
  return fileList;
}

/**
 * 从文件内容中提取 t`...` 文本
 */
function extractTextsFromContent(content, filePath) {
  const matches = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineNumber) => {
    // 跳过注释行
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
      return;
    }
    
    // 查找该行中的 t`...` 模式
    let match;
    const regex = new RegExp(T_REGEX.source, T_REGEX.flags);
    
    while ((match = regex.exec(line)) !== null) {
      const text = match[1];
      
      // 过滤掉明显错误的提取
      if (text.length > 0 && text.length < 100 && // 限制长度
          !text.includes('\n') && !text.includes('\r') && // 不包含换行符
          !text.includes('\\n') && !text.includes('\\r') && // 不包含转义换行符
          !/^\s*$/.test(text) && // 不是纯空白
          !text.includes('function') && // 不包含代码关键字
          !text.includes('console') &&
          !text.includes('return') &&
          text.split(' ').length < 20) { // 单词数量限制
        matches.push({
          text,
          file: filePath,
          line: lineNumber + 1
        });
        foundTexts.add(text);
      }
    }
  });
  
  return matches;
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  try {
    const fullPath = join(rootDir, filePath);
    const content = readFileSync(fullPath, 'utf-8');
    const matches = extractTextsFromContent(content, filePath);
    
    if (matches.length > 0) {
      console.log(`📄 ${filePath}: 找到 ${matches.length} 个文本`);
      matches.forEach(match => {
        console.log(`   第${match.line}行: "${match.text}"`);
      });
    }
    
    return matches;
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    return [];
  }
}

/**
 * 更新 i18n.json 文件
 */
function updateI18nFile() {
  const i18nPath = join(rootDir, 'packages/shared/src/i18n/i18n.json');
  let existingTranslations = {};
  
  // 读取现有翻译
  if (existsSync(i18nPath)) {
    try {
      const content = readFileSync(i18nPath, 'utf-8');
      existingTranslations = JSON.parse(content);
      console.log(`📖 已读取现有翻译文件: ${Object.keys(existingTranslations).length} 条`);
    } catch (error) {
      console.warn(`⚠️  读取现有翻译文件失败:`, error.message);
    }
  }
  
  // 生成新的翻译映射
  const newTranslations = { ...existingTranslations };
  let newCount = 0;
  let updatedCount = 0;
  
  Array.from(foundTexts).sort().forEach(text => {
    if (!newTranslations[text]) {
      // 使用新格式：{ "text": {} } - 只提取key，不提供翻译
      newTranslations[text] = {};
      newCount++;
    } else {
      updatedCount++;
    }
  });
  
  // 写入文件
  try {
    writeFileSync(i18nPath, JSON.stringify(newTranslations, null, 2), 'utf-8');
    console.log(`\n✅ i18n.json 已更新:`);
    console.log(`   📝 新增条目: ${newCount} 条`);
    console.log(`   🔄 保持现有: ${updatedCount} 条`);
    console.log(`   📊 总计: ${Object.keys(newTranslations).length} 条`);
    console.log(`   📁 文件位置: ${i18nPath}`);
  } catch (error) {
    console.error(`❌ 写入翻译文件失败:`, error.message);
  }
  
  return newTranslations;
}

/**
 * 生成提取报告
 */
function generateReport(allMatches) {
  console.log(`\n📊 提取报告:`);
  console.log(`=`.repeat(50));
  
  // 按文件统计
  const fileStats = {};
  allMatches.forEach(match => {
    if (!fileStats[match.file]) {
      fileStats[match.file] = 0;
    }
    fileStats[match.file]++;
  });
  
  console.log(`\n📁 按文件统计:`);
  Object.entries(fileStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`   ${file}: ${count} 个`);
    });
  
  console.log(`\n✨ 提取完成! 总共找到 ${foundTexts.size} 个唯一文本`);
}

/**
 * 主函数
 */
function main() {
  console.log(`🚀 开始提取 i18n 文本...`);
  console.log(`📂 扫描目录: ${SCAN_DIRS.join(', ')}`);
  console.log(`📄 文件类型: ${FILE_EXTENSIONS.join(', ')}`);
  console.log('');
  
  // 获取所有需要处理的文件
  let allFiles = [];
  SCAN_DIRS.forEach(dir => {
    const files = getAllFiles(dir);
    allFiles = allFiles.concat(files);
  });
  
  console.log(`📋 找到 ${allFiles.length} 个文件\n`);
  
  // 处理所有文件
  const allMatches = [];
  allFiles.forEach(file => {
    const matches = processFile(file);
    allMatches.push(...matches);
  });
  
  console.log(`\n🔍 扫描完成! 找到 ${allMatches.length} 个 t\`...\` 用法`);
  console.log(`📝 唯一文本: ${foundTexts.size} 个`);
  
  // 更新翻译文件
  updateI18nFile();
  
  // 生成报告
  generateReport(allMatches);
  
  // 提供下一步建议
  console.log(`\n📋 下一步建议:`);
  console.log(`   1. 检查生成的 packages/shared/src/i18n/i18n.json 文件`);
  console.log(`   2. 手动添加需要的翻译到每个条目中`);
  console.log(`   3. 格式: { "English Text": { "zh": "中文翻译" } }`);
  console.log(`   4. 测试前端界面的国际化效果`);
}

// 运行脚本
main();