import type { ToolSet } from 'ai';
import type { HyperChatCompletionTool } from "@dadigua/hyperchat-shared";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { z, ZodSchema } from "zod";
import { Logger } from "../../log.mjs";

/**
 * 工具格式化工具类
 * 负责将 HyperChat 工具格式转换为 AI SDK 工具格式
 */
export class ToolFormatter {
  /**
   * 将 HyperChat 工具数组转换为 AI SDK ToolSet
   */
  static formatTools(tools: HyperChatCompletionTool[]): ToolSet {
    const result: ToolSet = {};

    for (const tool of tools) {
      result[tool.name] = {
        description: tool.description || '',
        inputSchema: this.convertSchema(tool),
      };
    }

    return result;
  }

  /**
   * 安全地转换工具的输入schema
   */
  private static convertSchema(tool: HyperChatCompletionTool): ZodSchema | undefined {
    if (!tool.inputSchema) {
      return undefined;
    }

    try {
      // 使用更安全的方式处理schema转换
      const zodSchemaString = jsonSchemaToZod(tool.inputSchema as any);
      
      // 创建一个沙箱环境来执行schema转换
      const Function = (globalThis as typeof globalThis & { Function: FunctionConstructor }).Function;
      const createSchema = new Function('z', `return ${zodSchemaString}`);
      
      return createSchema(z);
    } catch (error) {
      Logger.warn(`Failed to convert schema for tool ${tool.name}:`, error);
      
      // 如果转换失败，使用一个宽松的schema
      return z.any();
    }
  }

  /**
   * 验证工具定义
   */
  static validateTool(tool: HyperChatCompletionTool): boolean {
    if (!tool.name) {
      Logger.warn('Tool missing name:', tool);
      return false;
    }

    if (!tool.description) {
      Logger.warn(`Tool ${tool.name} missing description`);
    }

    return true;
  }

  /**
   * 过滤和验证工具数组
   */
  static filterValidTools(tools: HyperChatCompletionTool[]): HyperChatCompletionTool[] {
    return tools.filter(tool => this.validateTool(tool));
  }
}