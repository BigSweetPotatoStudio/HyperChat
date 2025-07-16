#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 跨平台复制 web 构建产物到 electron 目录
 * 替代原来的 Unix 命令: mkdir -p dist/core/web-build && cp -r ../web/build/* dist/core/web-build/
 */

const sourceDir = path.join(__dirname, '..', '..', 'web', 'build');
const targetDir = path.join(__dirname, '..', 'dist', 'core', 'web-build');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log(`📂 复制 Web 构建产物...`);
  console.log(`   源目录: ${sourceDir}`);
  console.log(`   目标目录: ${targetDir}`);
  
  // 检查源目录是否存在
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ 错误: 源目录不存在 ${sourceDir}`);
    console.error(`   请先运行: cd ../web && npm run build`);
    process.exit(1);
  }
  
  // 确保目标目录存在
  fs.mkdirSync(targetDir, { recursive: true });
  
  // 复制所有文件
  copyRecursiveSync(sourceDir, targetDir);
  
  console.log(`✅ Web 构建产物复制完成!`);
} catch (error) {
  console.error(`❌ 复制失败:`, error.message);
  process.exit(1);
}