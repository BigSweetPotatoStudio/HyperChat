#!/usr/bin/env node

/**
 * 同步 core 包的 dependencies 到 electron 包
 * 因为 electron 是 Node.js 的超集，可以使用所有 Node.js 依赖
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CORE_PACKAGE_PATH = join(__dirname, '../../core/package.json');
const ELECTRON_PACKAGE_PATH = join(__dirname, '../package.json');

function main() {
  try {
    console.log('📦 开始同步 core 包的 dependencies 到 electron 包...');

    // 读取 core 包的 package.json
    const corePackageJson = JSON.parse(readFileSync(CORE_PACKAGE_PATH, 'utf8'));
    const coreDeps = corePackageJson.dependencies || {};

    // 读取 electron 包的 package.json
    const electronPackageJson = JSON.parse(readFileSync(ELECTRON_PACKAGE_PATH, 'utf8'));
    const electronDeps = electronPackageJson.dependencies || {};

    console.log(`🔍 Core 包有 ${Object.keys(coreDeps).length} 个依赖`);
    console.log(`🔍 Electron 包现有 ${Object.keys(electronDeps).length} 个依赖`);

    // 需要排除的依赖（electron 特有或不兼容的）
    const excludedDeps = new Set([
    ]);

    // 合并依赖，core 的依赖会覆盖 electron 现有的同名依赖
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const mergedDeps = { ...electronDeps };

    for (const [depName, depVersion] of Object.entries(coreDeps)) {
      if (excludedDeps.has(depName)) {
        console.log(`⏭️  跳过排除依赖: ${depName}`);
        skippedCount++;
        continue;
      }

      if (depName in electronDeps) {
        if (electronDeps[depName] !== depVersion) {
          console.log(`🔄 更新依赖: ${depName} ${electronDeps[depName]} → ${depVersion}`);
          updatedCount++;
        }
      } else {
        console.log(`➕ 新增依赖: ${depName}@${depVersion}`);
        addedCount++;
      }

      mergedDeps[depName] = depVersion;
    }

    // 按字母顺序排序依赖
    const sortedDeps = {};
    Object.keys(mergedDeps)
      .sort()
      .forEach(key => {
        sortedDeps[key] = mergedDeps[key];
      });

    // 更新 electron 包的 dependencies
    electronPackageJson.dependencies = sortedDeps;

    // 写回文件，保持格式化
    writeFileSync(
      ELECTRON_PACKAGE_PATH,
      JSON.stringify(electronPackageJson, null, 2) + '\n',
      'utf8'
    );

    console.log('\n✅ 同步完成！');
    console.log(`📊 统计：`);
    console.log(`   - 新增依赖: ${addedCount} 个`);
    console.log(`   - 更新依赖: ${updatedCount} 个`);
    console.log(`   - 跳过依赖: ${skippedCount} 个`);
    console.log(`   - 总依赖数: ${Object.keys(sortedDeps).length} 个`);

    if (addedCount > 0 || updatedCount > 0) {
      console.log('\n💡 建议运行以下命令更新依赖：');
      console.log('   cd packages/electron && npm install');
    }

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    process.exit(1);
  }
}

main();