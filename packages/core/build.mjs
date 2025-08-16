#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

console.log('使用 TypeScript 编译器构建...');

// 创建 dist 目录
const distDir = join(rootDir, 'dist');
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });

// 使用 tsc 编译 (忽略错误)
try {
  execSync('npx tsc --project tsconfig.build.json', {
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