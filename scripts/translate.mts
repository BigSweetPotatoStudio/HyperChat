import {
  YAML,
  fs,
  argv,
  path,
  $,
  quotePowerShell,
  usePowerShell,
  os,
} from "zx";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import "dotenv/config";


if (os.platform() === "win32") {
  usePowerShell();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../");
let i18nPath = path.resolve(rootDir, "./packages/shared/src/i18n/i18n.json");

// 验证环境变量
if (!process.env.apiKey) {
  console.error("错误: 缺少 apiKey 环境变量");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.apiKey,
  baseURL: process.env.baseURL,
});

async function translateFile() {
  console.log("开始翻译 README 文件...");
  let s = await translateEN(fs.readFileSync("./README.zh.md").toString());
  fs.writeFileSync(
    "./README.md",
    `[中文](README.zh.md) | [English](README.md)
\n
${s}`
  );
    console.log("开始翻译 ChangeLog 文件...");
  let c = await translateEN(fs.readFileSync("./ChangeLog.zh.md").toString());
  fs.writeFileSync(
    "./ChangeLog.md",
    `[中文](ChangeLog.zh.md) | [English](ChangeLog.md)
\n
${c}`
  );
}
// 显示帮助信息
if (argv.help || argv.h) {
  console.log(`
用法: npx tsx scripts/translate.mts [选项]

选项:
  --help, -h        显示帮助信息
  --test           翻译 README 和 ChangeLog 文件（测试功能）
  --dry-run        仅显示需要翻译的条目，不执行翻译
  --force          强制重新翻译所有条目（包括已有翻译的）

环境变量:
  apiKey           OpenAI API 密钥（必需）
  baseURL          API 基础 URL（可选）

示例:
  npx tsx scripts/translate.mts              # 翻译 i18n.json 中缺失的条目
  npx tsx scripts/translate.mts --dry-run    # 查看需要翻译的条目
  npx tsx scripts/translate.mts --force      # 重新翻译所有条目
  `);
  process.exit(0);
}

async function main() {
  if (argv.test) {
    await translateFile()
    console.log("end");
    return;
  }

  try {
    // await translateFile();

    // 检查 i18n.json 文件是否存在
    if (!fs.existsSync(i18nPath)) {
      console.error(`错误: i18n.json 文件不存在: ${i18nPath}`);
      console.error(`请先运行 'node scripts/extract-i18n.mjs' 生成 i18n.json 文件`);
      process.exit(1);
    }
    console.log("开始翻译 packages/shared/src/i18n/i18n.json 文件...");
    const json = JSON.parse(fs.readFileSync(i18nPath).toString());
    let hasChanges = false;
    
    // 统计需要翻译的条目
    const needTranslation = Object.keys(json).filter(key => {
      if (argv.force) {
        return true; // 强制模式下翻译所有条目
      }
      return json[key].zh == null || json[key].zh === "";
    });
    
    if (needTranslation.length === 0) {
      console.log("✅ 所有条目都已有中文翻译，无需处理");
      return;
    }
    
    console.log(`📊 找到 ${needTranslation.length} 个需要翻译的条目`);
    
    // 如果是 dry-run 模式，只显示需要翻译的条目
    if (argv['dry-run']) {
      console.log("\n需要翻译的条目:");
      needTranslation.forEach((key, index) => {
        const status = json[key].zh ? '(重新翻译)' : '(新翻译)';
        console.log(`${index + 1}. ${key} ${status}`);
      });
      console.log(`\n总计: ${needTranslation.length} 个条目`);
      return;
    }

    for (let i = 0; i < needTranslation.length; i++) {
      const key = needTranslation[i];
      console.log(`翻译中 (${i + 1}/${needTranslation.length}): ${key}`);
      try {
        json[key].zh = await translateZh(key);
        hasChanges = true;
        // 添加延迟避免 API 限速
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`翻译失败，跳过: ${key}`, error);
      }
    }

    if (hasChanges) {
      // 备份原文件
      const backupPath = i18nPath + '.backup';
      fs.copyFileSync(i18nPath, backupPath);
      console.log(`已备份原文件到: ${backupPath}`);

      fs.writeFileSync(i18nPath, JSON.stringify(json, null, 2));
      console.log(`已更新 i18n.json 文件`);
      
      // 重新构建 shared 包以更新 dist 目录中的 JSON 文件
      console.log('重新构建 shared 包...');
      try {
        await $`npm run build --workspace=@dadigua/hyperchat-shared`;
        console.log('✅ shared 包构建完成，i18n.json 已同步到 dist 目录');
      } catch (error) {
        console.warn('⚠️  shared 包构建失败，可能需要手动运行: npm run build --workspace=@dadigua/hyperchat-shared');
        console.warn('错误:', error);
      }
    }

  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }
}

// 运行主函数
await main();

export async function translateZh(content: string): Promise<string> {
  try {
    const prompt = `作为AI翻译助手，请将以下内容从英文翻译成中文：
  
规则：
1. 保持原文的格式和换行
2. 不要添加额外的标点符号
3. 如果是空字符串，请返回空字符串

需要翻译的内容是: "${content}"

直接返回翻译结果，无需解释。`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "google/gemini-2.5-flash",
    });

    const result = chatCompletion.choices?.[0]?.message?.content;
    if (!result) {
      throw new Error("翻译结果为空");
    }

    return result.replace(/^"|"$/g, "");
  } catch (error) {
    console.error(`翻译失败: ${content}`, error);
    throw error;
  }
}

export async function translateEN(content: string): Promise<string> {
  try {
    const prompt = `作为AI翻译助手，请将以下内容从中文翻译成英文：
  
规则：
1. 仅翻译中文文字内容
2. 保持所有标点符号和特殊字符的原样，包括但不限于 。，！？、(){}[]【】等
3. 保持原文的格式和换行
4. 不要添加额外的标点符号
5. 输出流畅自然的英文表达
6. 如果是空字符串，请返回空字符串

需要翻译的内容是: "${content}"

直接返回翻译结果，无需解释。`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
    });

    const result = chatCompletion.choices?.[0]?.message?.content;
    if (!result) {
      throw new Error("翻译结果为空");
    }

    return result.replace(/^"|"$/g, "");
  } catch (error) {
    console.error(`翻译失败: ${content}`, error);
    throw error;
  }
}

