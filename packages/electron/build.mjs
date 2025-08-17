#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

console.log('使用 TypeScript 编译器构建 Electron...');

// 创建 dist 目录
const distDir = join(rootDir, 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// 使用 tsc 编译 (忽略错误)
try {
  execSync('npx tsc', {
    stdio: 'inherit',
    cwd: rootDir
  });
  console.log('TypeScript 编译完成');
} catch (error) {
  console.log('TypeScript 编译有错误，但继续构建...');
  // 检查是否有输出文件
  if (existsSync(join(rootDir, 'dist'))) {
    console.log('发现输出文件，继续构建流程');
  } else {
    console.error('编译完全失败，没有输出文件');
    process.exit(1);
  }
}

// 复制共享资源文件
console.log('复制共享资源文件...');
const sharedI18nPath = join(__dirname, '..', 'shared', 'src', 'i18n', 'i18n.json');
const distI18nPath = join(distDir, 'shared', 'src', 'i18n', 'i18n.json');

// 确保目标目录存在
const i18nDir = dirname(distI18nPath);
if (!existsSync(i18nDir)) {
  mkdirSync(i18nDir, { recursive: true });
}

// 复制i18n.json文件
if (existsSync(sharedI18nPath)) {
  copyFileSync(sharedI18nPath, distI18nPath);
  console.log(`已复制: ${sharedI18nPath} -> ${distI18nPath}`);
} else {
  console.warn(`警告: 找不到i18n.json文件: ${sharedI18nPath}`);
}

// 替换tsconfig.paths中的别名引用为实际路径
console.log('替换路径别名...');
replacePathAliases();

/**
 * 替换tsconfig中定义的paths别名引用
 */
function replacePathAliases() {
  const sharedPackageName = '@dadigua/hyperchat-shared';
  
  // 检查shared包的输出文件类型
  const sharedIndexPath = join(distDir, 'shared', 'src', 'index.mjs');
  const sharedIndexJsPath = join(distDir, 'shared', 'src', 'index.js');
  
  let sharedPackagePath;
  let sharedDtsPath;
  if (existsSync(sharedIndexPath)) {
    sharedPackagePath = 'index.mjs';
    sharedDtsPath = 'index.d.ts';
  } else if (existsSync(sharedIndexJsPath)) {
    sharedPackagePath = 'index.js';
    sharedDtsPath = 'index.d.ts';
  } else {
    console.warn('警告: 找不到shared包的index文件');
    return;
  }
  
  // 查找所有.mjs和.d.ts文件
  const mjsFiles = findFiles(distDir, '.mjs');
  const dtsFiles = findFiles(distDir, '.d.ts');
  const dmtsFiles = findFiles(distDir, '.d.mts');
  
  const allFiles = [...mjsFiles, ...dtsFiles, ...dmtsFiles];
  
  console.log(`找到 ${allFiles.length} 个文件需要处理 (.mjs: ${mjsFiles.length}, .d.ts: ${dtsFiles.length}, .d.mts: ${dmtsFiles.length})`);
  
  allFiles.forEach(filePath => {
    try {
      let content = readFileSync(filePath, 'utf8');
      
      // 检查是否包含需要替换的别名
      if (content.includes(sharedPackageName)) {
        // 计算相对路径
        const fileDir = dirname(filePath);
        const isTypeDeclaration = filePath.endsWith('.d.ts') || filePath.endsWith('.d.mts');
        
        let targetPath;
        if (isTypeDeclaration) {
          targetPath = join(distDir, 'shared', 'src', sharedDtsPath);
        } else {
          targetPath = join(distDir, 'shared', 'src', sharedPackagePath);
        }
        
        let relativePath = relative(fileDir, targetPath);
        // 修复Windows路径：将反斜杠替换为正斜杠
        relativePath = relativePath.replace(/\\/g, '/');
        
        // 确保路径格式正确（使用./开头）
        const normalizedRelativePath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
        
        // 替换所有引用（支持import type和import语句）
        const originalContent = content;
        
        // 替换import type引用
        content = content.replace(
          new RegExp(`from\s+['"]${sharedPackageName}['"]`, 'g'),
          `from '${normalizedRelativePath}'`
        );
        
        // 替换import引用（确保不重复替换）
        content = content.replace(
          new RegExp(`['"]${sharedPackageName}['"]`, 'g'),
          `'${normalizedRelativePath}'`
        );
        
        if (content !== originalContent) {
          writeFileSync(filePath, content, 'utf8');
          console.log(`已更新: ${filePath} -> ${normalizedRelativePath}`);
        }
      }
    } catch (error) {
      console.warn(`处理文件 ${filePath} 时出错: ${error.message}`);
    }
  });
}

/**
 * 查找指定目录下的所有指定扩展名的文件
 */
function findFiles(dir, extension) {
  const files = [];
  
  function traverse(currentDir) {
    if (!existsSync(currentDir)) return;
    
    const items = readdirSync(currentDir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = join(currentDir, item.name);
      
      if (item.isDirectory()) {
        traverse(fullPath);
      } else if (item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}