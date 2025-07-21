#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 开始发布新版本...');

try {

  // 获取当前版本
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const currentVersion = packageJson.version;
  console.log(`📦 当前版本: ${currentVersion}`);

  // 升级版本
  console.log('🔢 升级 alpha 版本...');
  execSync('npm version prerelease --preid=alpha --no-git-tag-version', { stdio: 'inherit' });

  // 同步版本到所有包
  console.log('🔄 同步版本到所有包...');
  execSync('npm run version:sync', { stdio: 'inherit' });

  // 同步 electron 依赖
  console.log('🔄 同步 electron 依赖...');
  execSync('npm run --prefix packages/electron sync-core-dependencies', { stdio: 'inherit' });

  // 获取新版本
  const newPackageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  const newVersion = newPackageJson.version;
  console.log(`✅ 版本已升级: ${currentVersion} → ${newVersion}`);


  // 询问是否推送
  console.log('\n🎯 版本发布准备完成！');
  console.log(`📦 新版本: ${newVersion}`);
  console.log('\n选择下一步操作:');
  console.log('1️⃣  git push origin dev2    # 推送并触发 npm 发布');
  console.log('2️⃣  git reset HEAD~1       # 撤销版本提交');
  console.log('');

} catch (error) {
  console.error('❌ 发布失败:', error.message);
  process.exit(1);
}