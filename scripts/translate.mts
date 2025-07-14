import {
  fs,
  argv,
  path,
  $,
  usePowerShell,
  os,
} from "zx";
import { fileURLToPath } from "url";
import "dotenv/config";
import { z } from "zod";
import { generateObject, streamObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

if (os.platform() === "win32") {
  usePowerShell();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../");
const i18nPath = path.resolve(rootDir, "./packages/shared/src/i18n/i18n.json");

// 🎯 HyperChat 专业术语词典
const TERMINOLOGY_DICT = {
  "Agent": "代理",
  "Agents": "代理",
  "MCP": "MCP",
  "MCP Server": "MCP 服务器", 
  "MCP Client": "MCP 客户端",
  "Workspace": "工作区",
  "Workspaces": "工作区",
  "Chat": "聊天",
  "Model": "模型",
  "Provider": "提供商",
  "API Key": "API 密钥",
  "Task": "任务",
  "Tasks": "任务",
  "Schedule": "调度",
  "Scheduler": "调度器",
  "CLI": "命令行工具",
  "Command": "命令",
  "Template": "模板",
  "Gateway": "网关",
  "Token": "令牌",
  "Prompt": "提示词",
  "Temperature": "温度",
  "Tool": "工具",
  "Tools": "工具",
  "Resource": "资源",
  "System Prompt": "系统提示词",
  "Chat Log": "聊天记录",
  "History": "历史记录",
  "Session": "会话",
  "Configuration": "配置",
  "Settings": "设置"
};

// 🎯 软件背景信息和翻译上下文
const HYPERCHAT_CONTEXT = `
HyperChat 是一个多平台的 AI 聊天应用，具有以下特点：
- 支持多种 AI 模型（OpenAI、Claude、Gemini、Qwen、Deepseek 等）
- 完整的 MCP（模型上下文协议）支持
- 工作区概念：每个项目可以有独立的配置和代理
- AI 代理系统：可创建专门用途的 AI 助手
- 任务调度系统：支持定时任务执行
- 多平台支持：Web、桌面（Electron）、命令行（CLI）
- 支持多语言界面（中文/英文）

UI 组件包括：表单、按钮、菜单、设置面板、聊天界面、文件管理等。
用户群体：开发者、AI 研究人员、需要 AI 辅助工作的专业人士。
`;

// 🎯 翻译结果 Schema - 批量翻译
const BatchTranslationSchema = z.object({
  translations: z.array(z.object({
    index: z.number(),
    original: z.string(),
    translation: z.string(),
    confidence: z.number().min(0).max(1).optional().describe("翻译置信度，0-1之间")
  })).describe("按原始顺序排列的翻译结果数组")
});

// 🎯 翻译结果 Schema - 单个翻译
const SingleTranslationSchema = z.object({
  translation: z.string().describe("翻译后的中文文本"),
  confidence: z.number().min(0).max(1).optional().describe("翻译置信度，0-1之间"),
  reasoning: z.string().optional().describe("翻译推理过程")
});

// 🎯 AI 提供商配置
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  apiKey: string;
  baseURL?: string;
}

// 🎯 获取 AI 模型
function getAIModel(config: AIConfig) {
  switch (config.provider) {
    case 'openai':
      const openai = createOpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });
      return openai(config.model);
    
    case 'anthropic':
      const anthropic = createAnthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });
      return anthropic(config.model);
    
    case 'google':
      const google = createGoogleGenerativeAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL
      });
      return google(config.model);
    
    default:
      throw new Error(`不支持的 AI 提供商: ${config.provider}`);
  }
}

// 🎯 创建翻译提示词 - 批量
function createBatchTranslationPrompt(items: string[]): string {
  const terminologyList = Object.entries(TERMINOLOGY_DICT)
    .map(([en, zh]) => `- ${en} → ${zh}`)
    .join('\n');

  const itemsList = items.map((text, index) => `${index + 1}. "${text}"`).join('\n');

  return `作为专业的软件本地化翻译专家，请将以下 HyperChat 软件界面文本从英文翻译成中文。

【软件背景】${HYPERCHAT_CONTEXT}

【专业术语词典】
${terminologyList}

【翻译原则】
1. 保持用户界面的简洁性和一致性
2. 使用中国大陆用户习惯的表达方式
3. 技术术语保持准确性，优先使用词典中的对应翻译
4. 保持原文的格式、标点符号和特殊字符
5. 错误信息要清晰易懂，帮助用户快速定位问题
6. 按钮和菜单项要简洁有力
7. 如果原文是空字符串，返回空字符串
8. 确保翻译质量高且专业，符合软件界面标准

【待翻译文本列表】
${itemsList}

请按照相同的顺序和索引返回结构化的翻译结果。每个翻译都应该准确、自然且符合中文表达习惯。`;
}

// 🎯 创建翻译提示词 - 单个
function createSingleTranslationPrompt(text: string): string {
  const terminologyList = Object.entries(TERMINOLOGY_DICT)
    .map(([en, zh]) => `- ${en} → ${zh}`)
    .join('\n');

  return `作为专业的软件本地化翻译专家，请将以下 HyperChat 软件界面文本从英文翻译成中文。

【软件背景】${HYPERCHAT_CONTEXT}

【专业术语词典】
${terminologyList}

【翻译原则】
1. 保持用户界面的简洁性和一致性
2. 使用中国大陆用户习惯的表达方式
3. 技术术语保持准确性，优先使用词典中的对应翻译
4. 保持原文的格式、标点符号和特殊字符
5. 错误信息要清晰易懂，帮助用户快速定位问题
6. 按钮和菜单项要简洁有力
7. 如果原文是空字符串，返回空字符串

【待翻译文本】"${text}"

请提供高质量的中文翻译，确保准确性和专业性。`;
}

// 🎯 批量翻译函数
export async function translateBatch(items: string[], config: AIConfig): Promise<string[]> {
  if (items.length === 0) return [];
  
  try {
    const model = getAIModel(config);
    const prompt = createBatchTranslationPrompt(items);
    
    console.log(`🤖 使用 ${config.provider}/${config.model} 进行批量翻译...`);
    
    const result = await generateObject({
      model,
      schema: BatchTranslationSchema,
      prompt,
      temperature: 0.1, // 低温度确保一致性
    } as any) as any;
    
    // 按索引排序并提取翻译结果
    const sortedTranslations = result.object.translations
      .sort((a, b) => a.index - b.index)
      .map(t => t.translation);
    
    if (sortedTranslations.length !== items.length) {
      console.warn(`⚠️  翻译数量不匹配，期望 ${items.length}，实际 ${sortedTranslations.length}`);
      return await translateFallback(items, config);
    }
    
    // 质量检查
    let lowConfidenceCount = 0;
    result.object.translations.forEach(t => {
      if (t.confidence && t.confidence < 0.8) {
        lowConfidenceCount++;
        console.warn(`⚠️  低置信度翻译: "${t.original}" -> "${t.translation}" (${t.confidence})`);
      }
    });
    
    if (lowConfidenceCount > 0) {
      console.warn(`⚠️  发现 ${lowConfidenceCount} 个低置信度翻译`);
    }
    
    return sortedTranslations;
  } catch (error) {
    console.warn('批量翻译失败，回退到单个翻译模式:', error);
    return await translateFallback(items, config);
  }
}

// 🎯 单个翻译函数
export async function translateSingle(text: string, config: AIConfig): Promise<string> {
  try {
    const model = getAIModel(config);
    const prompt = createSingleTranslationPrompt(text);
    
    const result = await generateObject({
      model,
      schema: SingleTranslationSchema,
      prompt,
      temperature: 0.1,
    } as any) as any;
    
    // 质量检查
    if (result.object.confidence && result.object.confidence < 0.8) {
      console.warn(`⚠️  低置信度翻译: "${text}" -> "${result.object.translation}" (${result.object.confidence})`);
      if (result.object.reasoning) {
        console.warn(`   推理: ${result.object.reasoning}`);
      }
    }
    
    return result.object.translation;
  } catch (error) {
    console.error(`单个翻译失败: ${text}`, error);
    throw error;
  }
}

// 🎯 回退翻译方法
async function translateFallback(items: string[], config: AIConfig): Promise<string[]> {
  console.log('使用单个翻译回退模式...');
  const results: string[] = [];
  for (const item of items) {
    try {
      const translation = await translateSingle(item, config);
      results.push(translation);
      await new Promise(resolve => setTimeout(resolve, 200)); // 增加延迟避免限速
    } catch (error) {
      console.error(`翻译失败: ${item}`, error);
      results.push(item); // 翻译失败时保持原文
    }
  }
  return results;
}

// 🎯 翻译质量验证
function validateTranslation(original: string, translation: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // 检查是否为空
  if (!translation.trim()) {
    if (original.trim()) {
      issues.push("翻译结果为空但原文不为空");
    }
  }
  
  // 检查是否包含英文（可能翻译不完整）
  if (/[a-zA-Z]{3,}/.test(translation) && translation !== original) {
    // 排除专业术语
    const hasValidTerminology = Object.values(TERMINOLOGY_DICT).some(term => 
      translation.includes(term)
    );
    if (!hasValidTerminology) {
      issues.push("翻译中包含较长英文单词");
    }
  }
  
  // 检查长度是否合理
  if (translation.length > original.length * 4) {
    issues.push("翻译长度异常过长");
  }
  
  // 检查专业术语使用
  for (const [en, zh] of Object.entries(TERMINOLOGY_DICT)) {
    if (original.includes(en) && !translation.includes(zh) && !translation.includes(en)) {
      issues.push(`专业术语 "${en}" 可能翻译不准确`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// 🎯 解析 AI 配置
function parseAIConfig(): AIConfig {
  const provider = (argv.provider || 'openai') as AIConfig['provider'];
  const model = argv.model || "google/gemini-2.5-flash";
  const apiKey = process.env.apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_API_KEY;
  const baseURL = process.env.baseURL;

  if (!apiKey) {
    console.error("❌ 错误: 缺少 API 密钥");
    console.error("请设置环境变量: apiKey 或对应的提供商 API 密钥");
    process.exit(1);
  }

  return {
    provider,
    model,
    apiKey,
    baseURL
  };
}

// 🎯 主函数
async function main() {
  if (argv.help || argv.h) {
    console.log(`
🌐 HyperChat 智能翻译工具 (基于 AI SDK)

用法: npx tsx scripts/translate-ai-sdk.mts [选项]

选项:
  --help, -h          显示帮助信息
  --dry-run          仅显示需要翻译的条目，不执行翻译
  --force            强制重新翻译所有条目（包括已有翻译的）
  --batch-size N     批量翻译大小（默认: 8）
  --validate         仅验证现有翻译质量
  --provider NAME    AI 提供商 (openai|anthropic|google, 默认: openai)
  --model MODEL      指定模型 (默认: gpt-4o-mini)

环境变量:
  apiKey             API 密钥（通用）
  OPENAI_API_KEY     OpenAI API 密钥
  ANTHROPIC_API_KEY  Anthropic API 密钥
  GOOGLE_API_KEY     Google API 密钥
  baseURL            API 基础 URL（可选）

特性:
  ✅ 基于独立 AI SDK，轻量高效
  ✅ 支持多个 AI 提供商 (OpenAI/Anthropic/Google)
  ✅ JSON Schema 确保翻译结构化和一致性
  ✅ 针对 HyperChat 软件的专业术语词典
  ✅ 智能批量翻译减少 API 调用
  ✅ 置信度评估和质量验证
  ✅ 智能回退机制

示例:
  npx tsx scripts/translate-ai-sdk.mts                           # OpenAI 默认翻译
  npx tsx scripts/translate-ai-sdk.mts --provider anthropic      # 使用 Claude
  npx tsx scripts/translate-ai-sdk.mts --provider google         # 使用 Gemini
  npx tsx scripts/translate-ai-sdk.mts --model gpt-4o           # 指定模型
  npx tsx scripts/translate-ai-sdk.mts --dry-run                # 预览翻译计划
  npx tsx scripts/translate-ai-sdk.mts --validate               # 验证翻译质量
    `);
    process.exit(0);
  }

  try {
    const aiConfig = parseAIConfig();
    
    // 检查 i18n.json 文件是否存在
    if (!fs.existsSync(i18nPath)) {
      console.error(`❌ 错误: i18n.json 文件不存在: ${i18nPath}`);
      console.error(`请先运行 'node scripts/extract-i18n.mjs' 生成 i18n.json 文件`);
      process.exit(1);
    }

    console.log("🌐 开始 HyperChat 智能翻译 (基于 AI SDK)...");
    console.log(`🤖 使用: ${aiConfig.provider}/${aiConfig.model}`);
    
    const json = JSON.parse(fs.readFileSync(i18nPath).toString());
    let hasChanges = false;
    
    // 仅验证模式
    if (argv.validate) {
      console.log("🔍 验证现有翻译质量...");
      let issues = 0;
      for (const [key, value] of Object.entries(json)) {
        const entry = value as { zh?: string };
        if (entry.zh) {
          const validation = validateTranslation(key, entry.zh);
          if (!validation.isValid) {
            console.warn(`⚠️  [${key}]: ${validation.issues.join(', ')}`);
            issues++;
          }
        }
      }
      console.log(issues === 0 ? "✅ 所有翻译质量良好" : `⚠️  发现 ${issues} 个质量问题`);
      return;
    }
    
    // 统计需要翻译的条目
    const needTranslation = Object.keys(json).filter(key => {
      if (argv.force) {
        return true;
      }
      const entry = json[key] as { zh?: string };
      return entry.zh == null || entry.zh === "";
    });
    
    if (needTranslation.length === 0) {
      console.log("✅ 所有条目都已有中文翻译，无需处理");
      return;
    }
    
    console.log(`📊 找到 ${needTranslation.length} 个需要翻译的条目`);
    
    // 如果是 dry-run 模式，只显示需要翻译的条目
    if (argv['dry-run']) {
      console.log("\n📋 翻译预览:");
      needTranslation.forEach((key, index) => {
        const entry = json[key] as { zh?: string };
        const status = entry.zh ? '(重新翻译)' : '(新翻译)';
        console.log(`${index + 1}. ${key} ${status}`);
      });
      console.log(`\n📈 总计: ${needTranslation.length} 个条目`);
      console.log(`⚡ 预计使用批量翻译，减少 API 调用约 ${Math.ceil(needTranslation.length * 0.85)} 次`);
      console.log(`🤖 使用模型: ${aiConfig.provider}/${aiConfig.model}`);
      return;
    }

    // 🚀 批量翻译处理
    const batchSize = parseInt(argv['batch-size']) || 8; // 降低批次大小提高成功率
    const batches = [];
    for (let i = 0; i < needTranslation.length; i += batchSize) {
      batches.push(needTranslation.slice(i, i + batchSize));
    }

    console.log(`⚡ 使用批量翻译模式，${batches.length} 个批次，每批 ${batchSize} 个条目`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n🔄 处理批次 ${batchIndex + 1}/${batches.length} (${batch.length} 个条目)`);
      
      try {
        const translations = await translateBatch(batch, aiConfig);
        
        // 应用翻译结果并验证质量
        for (let i = 0; i < batch.length; i++) {
          const key = batch[i];
          if (translations[i]) {
            const entry = json[key] as { zh?: string };
            entry.zh = translations[i];
            hasChanges = true;
            
            // 翻译质量验证
            const validation = validateTranslation(key, translations[i]);
            if (validation.isValid) {
              console.log(`✅ ${key}`);
            } else {
              console.warn(`⚠️  ${key} (质量警告: ${validation.issues.join(', ')})`);
            }
          }
        }
        
        // 批次间延迟，避免 API 限速
        if (batchIndex < batches.length - 1) {
          console.log('⏳ 等待 1 秒避免 API 限速...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ 批次 ${batchIndex + 1} 翻译失败:`, error);
        console.log('继续处理下一批次...');
      }
    }

    if (hasChanges) {
      // 备份原文件
      const backupPath = i18nPath + '.backup-' + Date.now();
      fs.copyFileSync(i18nPath, backupPath);
      console.log(`\n💾 已备份原文件到: ${backupPath}`);

      fs.writeFileSync(i18nPath, JSON.stringify(json, null, 2));
      console.log(`✅ 已更新 i18n.json 文件`);
      
      // 重新构建 shared 包
      console.log('\n🔧 重新构建 shared 包...');
      try {
        await $`npm run build --workspace=@dadigua/hyperchat-shared`;
        console.log('✅ shared 包构建完成，i18n.json 已同步到 dist 目录');
      } catch (error) {
        console.warn('⚠️  shared 包构建失败，可能需要手动运行: npm run build --workspace=@dadigua/hyperchat-shared');
      }
    }

    console.log(`\n🎉 翻译完成！使用 ${aiConfig.provider}/${aiConfig.model} 完成智能翻译`);

  } catch (error) {
    console.error("❌ 脚本执行失败:", error);
    process.exit(1);
  }
}

// 运行主函数
await main();