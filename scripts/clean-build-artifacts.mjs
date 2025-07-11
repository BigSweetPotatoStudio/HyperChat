#!/usr/bin/env node

/**
 * 清理构建产物脚本
 * 
 * 清理源码目录中错误生成的编译产物
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();

// 需要清理的文件类型
const cleanPatterns = [
  '*.js.map',
  '*.mjs.map',
  '*.d.ts.map'
];

// 需要清理的目录（相对于项目根目录）
const cleanDirs = [
  'packages/core/src',
  'packages/web/src',
  'packages/electron/src',
  'packages/cli/src'
];

console.log('🧹 开始清理构建产物...');

let totalCleaned = 0;

for (const dir of cleanDirs) {
  const fullPath = join(projectRoot, dir);
  
  try {
    // 检查目录是否存在
    if (statSync(fullPath).isDirectory()) {
      console.log(`📁 清理目录: ${dir}`);
      
      for (const pattern of cleanPatterns) {
        try {
          const command = `find "${fullPath}" -name "${pattern}" -type f`;
          const files = execSync(command, { encoding: 'utf8' }).trim();
          
          if (files) {
            const fileList = files.split('\n').filter(f => f.trim());
            console.log(`  🗑️  删除 ${fileList.length} 个 ${pattern} 文件`);
            
            // 删除文件
            execSync(`find "${fullPath}" -name "${pattern}" -type f -delete`);
            totalCleaned += fileList.length;
          }
        } catch (error) {
          // 忽略查找错误（通常是因为没有匹配的文件）
        }
      }
    }
  } catch (error) {
    console.log(`⚠️  目录不存在: ${dir}`);
  }
}

console.log(`✅ 清理完成！共清理 ${totalCleaned} 个文件`);

// 如果有参数 --verbose，显示当前构建输出目录的状态
if (process.argv.includes('--verbose')) {
  console.log('\\n📊 当前构建输出目录状态:');
  
  const outputDirs = [
    'packages/core/js',
    'packages/core/dist',
    'packages/web/dist',
    'packages/electron/dist',
    'packages/cli/dist'
  ];
  
  for (const dir of outputDirs) {
    const fullPath = join(projectRoot, dir);
    try {
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        const files = readdirSync(fullPath);
        console.log(`  📁 ${dir}: ${files.length} 个文件`);
      }
    } catch (error) {
      console.log(`  📁 ${dir}: 不存在`);
    }
  }
}