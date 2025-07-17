#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 将本地包复制到 node_modules，模拟 npm install 的效果
 * 让 electron-builder 能正常打包本地依赖
 */

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

function createPackageJson(targetDir, packageName, version = "2.0.0") {
  const packageJson = {
    name: packageName,
    version: version,
    main: "index.mjs",
    type: "module"
  };
  
  fs.writeFileSync(
    path.join(targetDir, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
  );
}

function getRootVersion() {
  try {
    const rootPackagePath = path.join(__dirname, '..', '..', '..', 'package.json');
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    return rootPackage.version;
  } catch (error) {
    console.warn('⚠️ 无法读取根目录版本，使用默认版本 2.0.0');
    return '2.0.0';
  }
}

function updateElectronPackageJson(currentVersion) {
  const electronPackagePath = path.join(__dirname, '..', 'package.json');
  const electronPackage = JSON.parse(fs.readFileSync(electronPackagePath, 'utf8'));
  
  // 更新本地依赖的版本号
  if (electronPackage.dependencies) {
    if (electronPackage.dependencies['@dadigua/hyperchat-shared']) {
      electronPackage.dependencies['@dadigua/hyperchat-shared'] = currentVersion;
    }
  }
  
  fs.writeFileSync(electronPackagePath, JSON.stringify(electronPackage, null, 2) + '\n');
  console.log(`📝 更新 electron package.json 中的依赖版本为: ${currentVersion}`);
}

function setupLocalDependencies() {
  console.log('🔧 设置本地依赖到 node_modules...');
  
  const electronRoot = path.join(__dirname, '..');
  const nodeModulesDir = path.join(electronRoot, 'node_modules');
  const currentVersion = getRootVersion();
  
  console.log(`📋 使用版本号: ${currentVersion}`);
  
  // 更新 electron package.json 中的版本号
  updateElectronPackageJson(currentVersion);
  
  // 本地包配置
  const localPackages = [
    {
      name: '@dadigua/hyperchat-shared',
      sourcePath: path.join(electronRoot, '..', 'shared', 'dist'),
      targetPath: path.join(nodeModulesDir, '@dadigua', 'hyperchat-shared')
    }
  ];
  
  for (const pkg of localPackages) {
    console.log(`📦 处理包: ${pkg.name}`);
    
    // 检查源目录是否存在
    if (!fs.existsSync(pkg.sourcePath)) {
      console.error(`❌ 错误: 源目录不存在 ${pkg.sourcePath}`);
      console.error(`   请先构建依赖包`);
      process.exit(1);
    }
    
    // 创建目标目录
    console.log(`   📁 创建目录: ${pkg.targetPath}`);
    fs.mkdirSync(pkg.targetPath, { recursive: true });
    
    // 复制文件
    console.log(`   📋 复制文件: ${pkg.sourcePath} → ${pkg.targetPath}`);
    copyRecursiveSync(pkg.sourcePath, pkg.targetPath);
    
    // 创建 package.json（如果不存在）
    const packageJsonPath = path.join(pkg.targetPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`   📝 创建 package.json`);
      createPackageJson(pkg.targetPath, pkg.name, currentVersion);
    }
    
    console.log(`   ✅ ${pkg.name} 设置完成`);
  }
  
  console.log('🎉 所有本地依赖设置完成！');
}

// 执行
try {
  setupLocalDependencies();
} catch (error) {
  console.error('❌ 设置本地依赖失败:', error.message);
  process.exit(1);
}