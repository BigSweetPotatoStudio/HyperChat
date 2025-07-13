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
    .describe("AI model key/identifier")
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

// 导出类型（使用 Schema 后缀避免与 types.mts 中的类型冲突）
export type BaseAIConfig = z.infer<typeof BaseAIConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// 默认基础AI配置工厂函数（因为 prompt 是必需的）
export function createDefaultBaseAIConfig(prompt: string): BaseAIConfig {
  return {
    prompt,
    isConfirmCallTool: false,
    allowMCPs: [],
  };
}

// 默认Agent配置工厂函数
export function createDefaultAgentConfig(name: string, prompt: string): AgentConfig {
  return {
    name,
    prompt,
    isConfirmCallTool: false,
    allowMCPs: [],
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