#!/usr/bin/env node

/**
 * 测试 Git 钩子是否正确配置
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 测试 Git 钩子配置...\n');

// 检查 Husky 文件是否存在
const huskyFiles = [
  '.husky/_/husky.sh',
  '.husky/pre-commit',
  '.husky/pre-push'
];

let allFilesExist = true;

for (const file of huskyFiles) {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 不存在`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ 部分 Husky 文件缺失！');
  process.exit(1);
}

// 检查 package.json 中的 scripts
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  
  console.log('\n📦 检查 package.json scripts:');
  
  const requiredScripts = ['prepare', 'pre-commit', 'pre-push', 'typecheck'];
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      console.log(`✅ script "${script}": ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ script "${script}" 缺失`);
    }
  }
  
  // 检查 devDependencies 中是否有 husky
  if (packageJson.devDependencies.husky) {
    console.log(`✅ Husky 依赖版本: ${packageJson.devDependencies.husky}`);
  } else {
    console.log('❌ Husky 依赖缺失');
  }
  
} catch (error) {
  console.log(`❌ 读取 package.json 失败: ${error.message}`);
  process.exit(1);
}

// 测试类型检查命令
console.log('\n🔍 测试类型检查命令:');
try {
  execSync('npm run typecheck', { stdio: 'pipe' });
  console.log('✅ typecheck 命令可用');
} catch (error) {
  console.log('⚠️  typecheck 命令执行失败（这可能是正常的，取决于代码状态）');
}

console.log('\n🎉 Git 钩子配置检查完成！');
console.log('\n📝 使用说明:');
console.log('1. 当你运行 git commit 时，会自动执行类型检查和 lint');
console.log('2. 当你运行 git push 时，会自动执行构建检查和依赖同步');
console.log('3. 如果检查失败，提交或推送会被阻止');
console.log('4. 团队成员在 npm install 后会自动启用钩子');