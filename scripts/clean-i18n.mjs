#!/usr/bin/env node

import { fs, path } from "zx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../");
const i18nPath = path.resolve(rootDir, "./packages/shared/src/i18n/i18n.json");

async function main() {
  console.log("🧹 开始清理 i18n.json 中包含变量的键...");

  // 检查文件是否存在
  if (!fs.existsSync(i18nPath)) {
    console.error(`❌ 错误: i18n.json 文件不存在: ${i18nPath}`);
    process.exit(1);
  }

  try {
    // 读取并解析 JSON 文件
    const jsonContent = fs.readFileSync(i18nPath, 'utf8');
    const i18nData = JSON.parse(jsonContent);
    
    // 统计信息
    const totalKeys = Object.keys(i18nData).length;
    let removedCount = 0;
    const removedKeys = [];
    
    console.log(`📊 总共找到 ${totalKeys} 个翻译键`);
    
    // 查找包含变量的键 (${xxx} 模式)
    const variableRegex = /\$\{[^}]+\}/;
    const keysWithTranslations = [];
    const keysWithoutTranslations = [];
    
    Object.keys(i18nData).forEach(key => {
      if (variableRegex.test(key)) {
        // 强制删除所有包含变量的键（因为代码已经修复，这些翻译不再使用）
        removedKeys.push(key);
        delete i18nData[key];
        removedCount++;
      }
    });
    
    if (removedCount === 0) {
      console.log("✅ 没有找到包含变量的键，无需清理");
      return;
    }
    
    console.log(`\n🗑️  找到 ${removedCount} 个包含变量的键（已删除）:`);
    removedKeys.forEach((key, index) => {
      console.log(`${index + 1}. "${key}"`);
    });
    
    // 备份原文件
    const backupPath = i18nPath + '.backup-' + Date.now();
    fs.copyFileSync(i18nPath, backupPath);
    console.log(`\n💾 已备份原文件到: ${backupPath}`);
    
    // 写入清理后的文件
    const cleanedContent = JSON.stringify(i18nData, null, 2);
    fs.writeFileSync(i18nPath, cleanedContent);
    
    const remainingKeys = Object.keys(i18nData).length;
    console.log(`\n✅ 清理完成!`);
    console.log(`📊 统计信息:`);
    console.log(`   - 原有键数: ${totalKeys}`);
    console.log(`   - 删除键数: ${removedCount}`);
    console.log(`   - 剩余键数: ${remainingKeys}`);
    
    // 重新构建 shared 包以更新 dist 目录
    console.log('\n🔧 重新构建 shared 包...');
    try {
      const { $ } = await import('zx');
      await $`npm run build --workspace=@dadigua/hyperchat-shared`;
      console.log('✅ shared 包构建完成，i18n.json 已同步到 dist 目录');
    } catch (error) {
      console.warn('⚠️  shared 包构建失败，可能需要手动运行: npm run build --workspace=@dadigua/hyperchat-shared');
      console.warn('错误:', error.message);
    }
    
  } catch (error) {
    console.error("❌ 脚本执行失败:", error.message);
    process.exit(1);
  }
}

// 运行主函数
await main();