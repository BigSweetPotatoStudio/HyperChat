#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取根目录的版本号
function getRootVersion() {
  const rootPackagePath = join(rootDir, 'package.json');
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
  return rootPackage.version;
}

// 更新子包的版本号
function updatePackageVersion(packagePath, version) {
  try {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    const oldVersion = packageJson.version;
    packageJson.version = version;
    
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`✅ ${packagePath.split('/').pop()}: ${oldVersion} → ${version}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新 ${packagePath} 失败:`, error.message);
    return false;
  }
}

// 主函数
function syncVersions() {
  const rootVersion = getRootVersion();
  console.log(`🔄 同步版本号: ${rootVersion}`);
  console.log('');
  
  // 定义所有需要同步的包
  const packages = [
    'packages/shared',
    'packages/core', 
    'packages/web',
    'packages/electron'
  ];
  
  let success = true;
  
  for (const pkg of packages) {
    const packagePath = join(rootDir, pkg);
    if (!updatePackageVersion(packagePath, rootVersion)) {
      success = false;
    }
  }
  
  console.log('');
  if (success) {
    console.log('🎉 所有包版本号同步完成！');
  } else {
    console.log('⚠️  部分包同步失败，请检查错误信息');
    process.exit(1);
  }
}

// 执行同步
syncVersions();