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
let i18nPath = path.resolve(rootDir, "./packages/web/src/i18n.json");

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
if (argv.test) {
  await translateFile()
  console.log("end");
} else {

  try {
    await translateFile();

    // 检查 i18n.json 文件是否存在
    if (!fs.existsSync(i18nPath)) {
      console.error(`错误: i18n.json 文件不存在: ${i18nPath}`);
      process.exit(1);
    }
    console.log("开始翻译 i18n.json 文件...");
    const json = JSON.parse(fs.readFileSync(i18nPath).toString());
    let hasChanges = false;

    for (let key in json) {
      if (json[key].zh == null) {
        console.log(`翻译中: ${key}`);
        try {
          json[key].zh = await translateZh(key);
          hasChanges = true;
          // 添加延迟避免 API 限速
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`翻译失败，跳过: ${key}`, error);
        }
      }
    }

    if (hasChanges) {
      // 备份原文件
      const backupPath = i18nPath + '.backup';
      fs.copyFileSync(i18nPath, backupPath);
      console.log(`已备份原文件到: ${backupPath}`);

      fs.writeFileSync(i18nPath, JSON.stringify(json, null, 2));
      console.log(`已更新 i18n.json 文件`);
    }

  } catch (error) {
    console.error("脚本执行失败:", error);
    process.exit(1);
  }
}

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

function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}
