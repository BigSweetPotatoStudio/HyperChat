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
// load using import
import { glob, globSync, globStream, globStreamSync, Glob } from "glob";

if (os.platform() === "win32") {
  usePowerShell();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let p = path.resolve(__dirname, "./web/src/i18n.json");

const openai = new OpenAI({
  apiKey: process.env.apiKey, // This is the default and can be omitted
  baseURL: process.env.baseURL,
});

// let o = YAML.parse(fs.readFileSync('./src/pages2/text.yaml').toString());
// fs.writeFileSync('./src/pages2/text.json', JSON.stringify(o, null, 2))
if (argv.test) {
  let s = await translateEN(fs.readFileSync("./README.zh.md").toString());
  fs.writeFileSync(
    "./README.md",
    `[中文](README.zh.md) | [English](README.md)
\n
${s}`
  );
  let c = await translateEN(fs.readFileSync("./ChangeLog.zh.md").toString());
  fs.writeFileSync(
    "./ChangeLog.md",
    `[中文](ChangeLog.zh.md) | [English](ChangeLog.md)
\n
${c}`
  );
} else {
  let json = JSON.parse(fs.readFileSync(p).toString());
  for (let key in json) {
    // if (!hasChinese(key)) {
    //   delete json[key];
    //   continue;
    // }
    // if (!find(key)) {
    //   delete json[key];
    //   continue;
    // }
    if (json[key].zh == null) {
      json[key].zh = await translateZh(key);
    }
  }
  fs.writeFileSync(p, JSON.stringify(json, null, 4));

  if ((await $`git diff README.zh.md`).toString().length > 0) {
    let s = await translateEN(fs.readFileSync("./README.zh.md").toString());
    fs.writeFileSync(
      "./README.md",
      `[中文](README.zh.md) | [English](README.md)
\n
${s}`
    );
  }
  if ((await $`git diff ChangeLog.zh.md`).toString().length > 0) {
    let c = await translateEN(fs.readFileSync("./ChangeLog.zh.md").toString());
    fs.writeFileSync(
      "./ChangeLog.md",
      `[中文](ChangeLog.zh.md) | [English](ChangeLog.md)
\n
${c}`
    );
  }
}

export async function translateZh(content) {
  content = `作为AI翻译助手，请将以下内容从英文翻译成中文：
  
规则：
1. 保持原文的格式和换行
2. 不要添加额外的标点符号
3. 如果是空字符串，请返回空字符串

需要翻译的内容是: "${content}"

直接返回翻译结果，无需解释。`;
  const chatCompletion: any = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: content,
      },
    ],
    model: "gpt-4o-mini",
  });
  return chatCompletion.choices[0].message.content.replace(/^"|"$/g, "");
}

export async function translateEN(content) {
  content = `作为AI翻译助手，请将以下内容从中文翻译成英文：
  
规则：
1. 仅翻译中文文字内容
2. 保持所有标点符号和特殊字符的原样，包括但不限于 。，！？、(){}[]【】等
3. 保持原文的格式和换行
4. 不要添加额外的标点符号
5. 输出流畅自然的英文表达
6. 如果是空字符串，请返回空字符串

需要翻译的内容是: "${content}"

直接返回翻译结果，无需解释。`;
  const chatCompletion: any = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: content,
      },
    ],
    model: "gpt-4o-mini",
  });
  return chatCompletion.choices[0].message.content.replace(/^"|"$/g, "");
}

function hasChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str);
}
