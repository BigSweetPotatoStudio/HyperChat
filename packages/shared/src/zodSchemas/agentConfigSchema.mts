import { z } from "zod";

/**
 * 基础AI配置 Schema
 * 定义所有AI相关配置的基础字段，可被 Agent、Chat 等继承使用
 */
export const BaseAIConfigSchema = z.object({
  prompt: z.string()
    .min(1, "Prompt cannot be empty")
    .describe("AI system prompt"),
    
  temperature: z.number()
    .min(0, "Temperature must be >= 0")
    .max(2, "Temperature must be <= 2")
    .optional()
    .describe("AI response temperature (0-2)"),
  
  isConfirmCallTool: z.boolean()
    .default(false)
    .describe("Whether to confirm before calling tools"),
  
  allowMCPs: z.array(z.string())
    .default([])
    .describe("List of allowed MCP server names"),
  
  maxAttachedDialogs: z.number()
    .int()
    .min(0, "Max attached dialogs must be >= 0")
    .max(100, "Max attached dialogs must be <= 100")
    .optional()
    .describe("Maximum number of attached dialog histories"),
  
  modelKey: z.string()
    .optional()
    .describe("AI model key/identifier"),
    
  maxTokens: z.number()
    .int()
    .min(100, "Max tokens must be >= 100")
    .max(32000, "Max tokens must be <= 32000")
    .default(4000)
    .describe("Maximum tokens for AI response"),
  
  maxContextTokens: z.number()
    .int()
    .min(1000, "Max context tokens must be >= 1000")
    .optional()
    .describe("Maximum context tokens before compression (overrides maxAttachedDialogs)"),
  
  compressionStrategy: z.enum(["dialogs", "tokens"])
    .default("tokens")
    .optional()
    .describe("Compression strategy: dialogs (轮数), tokens (token数量)")
});

/**
 * Agent配置 Schema
 * 继承 BaseAIConfig 并添加 Agent 特有的属性
 */
export const AgentConfigSchema = BaseAIConfigSchema.extend({
  name: z.string()
    .min(1, "Agent name cannot be empty")
    .max(100, "Agent name cannot exceed 100 characters")
    .describe("Agent name"),
  
  description: z.string()
    .optional()
    .describe("Agent description"),
  
  tags: z.array(z.string())
    .default([])
    .describe("Agent tags for categorization"),
  
  subAgents: z.array(z.string())
    .default([])
    .describe("Sub-agent names"),
  
  version: z.number()
    .int()
    .min(1)
    .default(1)
    .describe("Agent configuration version")
});

// 导出类型（从 Zod Schema 推导）
export type BaseAIConfig = z.infer<typeof BaseAIConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// 默认基础AI配置工厂函数（因为 prompt 是必需的）
export function createDefaultBaseAIConfig(prompt: string): BaseAIConfig {
  return {
    prompt,
    isConfirmCallTool: false,
    allowMCPs: [],
    maxTokens: 4000,
    // compressionStrategy 和 maxContextTokens 保持可选，让用户根据需要配置
  };
}

// 默认Agent配置工厂函数
export function createDefaultAgentConfig(name: string, prompt: string): AgentConfig {
  return {
    name,
    prompt,
    isConfirmCallTool: false,
    allowMCPs: [],
    maxTokens: 4000,
    tags: [],
    subAgents: [],
    version: 1,
  };
}

// 验证函数
export function validateBaseAIConfig(data: any): data is BaseAIConfig {
  return BaseAIConfigSchema.safeParse(data).success;
}

export function validateAgentConfig(data: any): data is AgentConfig {
  return AgentConfigSchema.safeParse(data).success;
}

// 配置合并工具函数
export function mergeBaseAIConfigs(base: BaseAIConfig, override: Partial<BaseAIConfig>): BaseAIConfig {
  return {
    ...base,
    ...override,
    // 特殊处理数组字段，确保不会意外清空
    allowMCPs: override.allowMCPs !== undefined ? override.allowMCPs : base.allowMCPs,
  };
}

/**
 * 简化的消息 Schema（只包含必要字段）
 * 完整的 MyMessage 类型过于复杂，这里只定义 ChatHistoryItem 所需的基本结构
 */
export const MessageSchema = z.object({
  role: z.enum(["user", "system", "assistant", "tool", "hyper_memory"]),
  content: z.union([z.string(), z.array(z.any())]), // CommonContent 类型过于复杂，使用简化版本
  // 其他字段为可选，保持向后兼容性
}).passthrough(); // 允许其他字段通过

/**
 * 聊天历史项 Schema
 * 支持会话级别的 AI 配置覆盖
 */
export const ChatHistoryItemSchema = z.object({
  label: z.string()
    .min(1, "Chat label cannot be empty")
    .describe("Chat session label"),
  
  key: z.string()
    .min(1, "Chat key cannot be empty")
    .describe("Unique chat session key"),
  
  messages: z.array(MessageSchema)
    .default([])
    .describe("Chat messages array"),
  
  agentName: z.string()
    .min(1, "Agent name cannot be empty")
    .describe("Associated agent name"),
  
  dateTime: z.number()
    .int()
    .positive("DateTime must be positive")
    .describe("Chat creation timestamp"),
  
  chatType: z.enum(["user", "task", "called"])
    .default("user")
    .describe("Type of chat session"),
  
  taskKey: z.string()
    .optional()
    .describe("Associated task key (if chat type is task)"),
  
  version: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Chat history format version"),
  
  // 🆕 会话级别的AI配置覆盖
  configOverrides: BaseAIConfigSchema.partial()
    .optional()
    .describe("Session-level AI configuration overrides")
});

// 导出 ChatHistoryItem 类型
export type ChatHistoryItemType = z.infer<typeof ChatHistoryItemSchema>;

// ChatHistoryItem 验证函数
export function validateChatHistoryItem(data: any): data is ChatHistoryItemType {
  return ChatHistoryItemSchema.safeParse(data).success;
}

// 创建默认聊天历史项工厂函数
export function createDefaultChatHistoryItem(
  label: string,
  key: string,
  agentName: string,
  chatType: "user" | "task" | "called" = "user"
): ChatHistoryItemType {
  return {
    label,
    key,
    messages: [],
    agentName,
    dateTime: Date.now(),
    chatType,
    version: 1,
  };
}

// 根据模型类型获取推荐的最大上下文token数量
export function getRecommendedMaxContextTokens(modelKey: string): number {
  const modelLower = modelKey.toLowerCase();
  
  // OpenAI 模型
  if (modelLower.includes('gpt-4o') || modelLower.includes('gpt-4-turbo')) {
    return 32000;
  }
  if (modelLower.includes('gpt-4')) {
    return 16000;
  }
  if (modelLower.includes('gpt-3.5') || modelLower.includes('gpt-35')) {
    return 8000;
  }
  
  // Claude 模型
  if (modelLower.includes('claude-3.5') || modelLower.includes('claude-3')) {
    return 32000;
  }
  if (modelLower.includes('claude-2')) {
    return 16000;
  }
  
  // Gemini 模型
  if (modelLower.includes('gemini-pro') || modelLower.includes('gemini-1.5')) {
    return 24000;
  }
  if (modelLower.includes('gemini')) {
    return 16000;
  }
  
  // 其他模型
  if (modelLower.includes('qwen') || modelLower.includes('deepseek')) {
    return 16000;
  }
  
  // 默认值
  return 8000;
}

// 创建智能配置的基础AI配置
export function createSmartBaseAIConfig(
  prompt: string,
  modelKey?: string,
  strategy: "dialogs" | "tokens" = "tokens"
): BaseAIConfig {
  const config = createDefaultBaseAIConfig(prompt);
  
  if (modelKey && strategy !== "dialogs") {
    config.maxContextTokens = getRecommendedMaxContextTokens(modelKey);
    config.compressionStrategy = strategy;
  }
  
  return config;
}