#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 清理临时复制到 node_modules 的本地包
 * 在 electron-builder 完成后恢复干净状态
 */

function removeRecursiveSync(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function cleanupLocalDependencies() {
  console.log('🧹 清理本地依赖...');
  
  const electronRoot = path.join(__dirname, '..');
  const nodeModulesDir = path.join(electronRoot, 'node_modules');
  
  // 要清理的本地包路径
  const localPackagePaths = [
    path.join(nodeModulesDir, '@dadigua', 'hyperchat-shared'),
    path.join(nodeModulesDir, '@dadigua')  // 如果目录空了也删除
  ];
  
  for (const packagePath of localPackagePaths) {
    if (fs.existsSync(packagePath)) {
      console.log(`🗑️  删除: ${packagePath}`);
      removeRecursiveSync(packagePath);
    }
  }
  
  // 清理空的作用域目录
  const scopeDirs = [
    path.join(nodeModulesDir, '@dadigua')
  ];
  
  for (const scopeDir of scopeDirs) {
    if (fs.existsSync(scopeDir)) {
      try {
        const items = fs.readdirSync(scopeDir);
        if (items.length === 0) {
          console.log(`🗑️  删除空目录: ${scopeDir}`);
          fs.rmdirSync(scopeDir);
        }
      } catch (error) {
        // 忽略错误，可能已经被删除
      }
    }
  }
  
  console.log('✅ 本地依赖清理完成！');
}

// 执行
try {
  cleanupLocalDependencies();
} catch (error) {
  console.error('❌ 清理失败:', error.message);
  process.exit(1);
}