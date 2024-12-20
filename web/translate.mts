import { YAML, fs, argv } from "zx";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.apiKey, // This is the default and can be omitted
  baseURL: process.env.baseURL,
});

// let o = YAML.parse(fs.readFileSync('./src/pages2/text.yaml').toString());
// fs.writeFileSync('./src/pages2/text.json', JSON.stringify(o, null, 2))
if (argv.test) {
  let s = await translate("");
  console.log(s);
} else {
  let json = JSON.parse(fs.readFileSync("./src/i18n.json").toString());
  for (let key in json) {
    if (!hasChinese(key)) {
      delete json[key];
      continue;
    }
    if (json[key].en == null) {
      json[key].en = await translate(key);
    }
  }
  fs.writeFileSync("./src/i18n.json", JSON.stringify(json, null, 4));
}

export async function translate(content) {
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
    model: "deepseek-chat",
  });
  return chatCompletion.choices[0].message.content.replace(/^"|"$/g, "");
}
function hasChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str);
}
