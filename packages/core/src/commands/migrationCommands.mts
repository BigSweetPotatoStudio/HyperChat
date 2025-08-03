import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import { WorkspaceManager } from "../workspace/workspaceManager.mjs";
import { AgentConfig, AIModelConfigItem, KnownProvider, MCPServerConfig } from "@dadigua/hyperchat-shared";
import { getAppSettingsManager } from "../data/appSettingsService.mjs";

// 老版本 Agent 数据格式
interface LegacyAgent {
  key: string;
  label: string;
  name: string;
  prompt: string;
  modelKey?: string;
  allowMCPs?: string[];
  temperature?: number;
  attachedDialogueCount?: number;
  confirm_call_tool?: boolean;
  callable?: boolean;
  description?: string;
  type?: string;
  subAgents?: string[];
}

interface LegacyAgentData {
  data: LegacyAgent[];
}

// 老版本 AI 模型数据格式
interface LegacyAIModel {
  key: string;
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
  name: string;
  type?: string;
  isStrict?: boolean;
  supportImage?: boolean;
  supportTool?: boolean;
  isDefault?: boolean;
  toolMode?: string;
  call_tool_step?: number;
}

interface LegacyAIModelData {
  data: LegacyAIModel[];
}

// 老版本 MCP 配置数据格式
interface LegacyMCPData {
  mcpServers: {
    [serverName: string]: MCPServerConfig;
  };
}

/**
 * 验证 Agent 名称是否合法
 */
function isValidAgentName(name: string): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }

  // 检查长度限制
  if (name.length > 100) {
    return false;
  }

  // 检查是否包含非法字符（文件系统不允许的字符）
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(name)) {
    return false;
  }

  // 检查是否为系统保留名称
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(name.toUpperCase())) {
    return false;
  }

  return true;
}

/**
 * 转换老版本 AI 模型数据到新格式
 */
function convertLegacyAIModelToNewFormat(legacyModel: LegacyAIModel): AIModelConfigItem {
  // 将老的 provider 映射到新的 KnownProvider
  let provider: KnownProvider = "unknown";

  const providerLower = legacyModel.provider.toLowerCase();
  if (providerLower === "openai") provider = "openai";
  else if (providerLower === "anthropic") provider = "anthropic";
  else if (providerLower === "gemini") provider = "gemini";
  else if (providerLower === "302") provider = "302";
  else if (providerLower === "openrouter") provider = "openrouter";
  else if (providerLower === "qwen") provider = "qwen";
  else if (providerLower === "deepseek") provider = "deepseek";
  else if (providerLower === "doubao") provider = "doubao";
  else if (providerLower === "xai") provider = "xai";
  else if (providerLower === "glm") provider = "glm";
  else if (providerLower === "ollama") provider = "ollama";
  else provider = "unknown"; // 其他未知提供商统一设为 unknown

  return {
    key: uuidv4(), // 生成新的 UUID
    name: legacyModel.name,
    model: legacyModel.model,
    provider: provider,
    supportImage: legacyModel.supportImage ?? true,
    supportTool: legacyModel.supportTool ?? true,
    call_tool_step: legacyModel.call_tool_step,
    type: (legacyModel.type as "llm" | "embedding") || "llm",
    toolMode: (legacyModel.toolMode as "standard" | "compatible") || "standard",
    apiKey: legacyModel.apiKey || "",
    baseURL: legacyModel.baseURL || "",
    fullName: `${provider}:${legacyModel.name}`
  };
}

/**
 * 转换老版本 Agent 数据到新格式
 */
function convertLegacyAgentToNewFormat(legacyAgent: LegacyAgent, modelKeyMapping?: Map<string, string>): AgentConfig {
  const name = legacyAgent.name || legacyAgent.label || `Agent-${legacyAgent.key}`;

  // 如果有模型映射，更新 modelKey
  let newModelKey = legacyAgent.modelKey;
  if (modelKeyMapping && legacyAgent.modelKey && modelKeyMapping.has(legacyAgent.modelKey)) {
    newModelKey = modelKeyMapping.get(legacyAgent.modelKey);
  }

  return {
    name: name.trim(),
    prompt: legacyAgent.prompt || '',
    description: legacyAgent.description,
    modelKey: newModelKey,
    allowMCPs: legacyAgent.allowMCPs || [],
    blockMCPTools: [], // 迁移过程中设为空数组
    temperature: legacyAgent.temperature || 0.7, // 默认温度
    isConfirmCallTool: legacyAgent.confirm_call_tool ?? false,
    maxTokens: 4000, // 默认值
    maxContextTokens: 32000, // 添加默认值
    tags: legacyAgent.type ? [legacyAgent.type] : [],
    subAgents: legacyAgent.subAgents || [],
    version: 1
  };
}

/**
 * 迁移命令接口
 */
export interface MigrationCommands {
  // 迁移老版本 gpts_list.json 数据到新的 Agent 系统
  migrateAgents: (params: {
    sourcePath?: string; // 源文件路径，默认为 ~/Documents/HyperChat/gpts_list.json
    targetScope?: "global" | "workspace"; // 目标范围，默认为 global
    dryRun?: boolean; // 是否为试运行模式
    force?: boolean; // 是否强制覆盖已存在的同名 Agent
    modelKeyMapping?: Map<string, string>; // 模型 key 映射（老 key -> 新 key）
  }) => Promise<{
    success: boolean;
    message: string;
    migrated: number;
    skipped: number;
    errors: number;
    details: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
  }>;

  // 迁移老版本 gpt_models.json 数据到新的 AI 配置系统
  migrateAIModels: (params: {
    sourcePath?: string; // 源文件路径，默认为 ~/Documents/HyperChat/gpt_models.json
    dryRun?: boolean; // 是否为试运行模式
    force?: boolean; // 是否强制覆盖已存在的同名模型
  }) => Promise<{
    success: boolean;
    message: string;
    migrated: number;
    skipped: number;
    errors: number;
    details: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
    modelKeyMapping: Map<string, string>; // 返回老 key -> 新 key 的映射
  }>;

  // 迁移老版本 mcp.json 数据到新的工作区 MCP 配置
  migrateMCPConfig: (params: {
    sourcePath?: string; // 源文件路径，默认为 ~/Documents/HyperChat/mcp.json
    targetScope?: "global" | "workspace"; // 目标范围，默认为 global
    dryRun?: boolean; // 是否为试运行模式
    force?: boolean; // 是否强制覆盖已存在的同名配置
  }) => Promise<{
    success: boolean;
    message: string;
    migrated: number;
    skipped: number;
    errors: number;
    details: {
      migrated: string[];
      skipped: { name: string; reason: string }[];
      errors: { name: string; error: string }[];
    };
  }>;

  // 完整迁移：先迁移 AI 模型，再迁移 MCP 配置，最后迁移 Agent（并更新模型引用）
  migrateAll: (params: {
    agentSourcePath?: string;
    modelSourcePath?: string;
    mcpSourcePath?: string;
    targetScope?: "global" | "workspace";
    dryRun?: boolean;
    force?: boolean;
  }) => Promise<{
    success: boolean;
    message: string;
    aiModels: {
      migrated: number;
      skipped: number;
      errors: number;
    };
    mcpConfig: {
      migrated: number;
      skipped: number;
      errors: number;
    };
    agents: {
      migrated: number;
      skipped: number;
      errors: number;
    };
    details: {
      aiModels: {
        migrated: string[];
        skipped: { name: string; reason: string }[];
        errors: { name: string; error: string }[];
      };
      mcpConfig: {
        migrated: string[];
        skipped: { name: string; reason: string }[];
        errors: { name: string; error: string }[];
      };
      agents: {
        migrated: string[];
        skipped: { name: string; reason: string }[];
        errors: { name: string; error: string }[];
      };
    };
  }>;
}

/**
 * 迁移命令实现
 */
export async function createMigrationCommands(workspaceManager: WorkspaceManager): Promise<MigrationCommands> {

  return {
    async migrateAIModels(params) {
      const {
        sourcePath = path.join(os.homedir(), "Documents", "HyperChat", "gpt_models.json"),
        dryRun = false,
        force = false
      } = params;

      const result = {
        success: false,
        message: "",
        migrated: 0,
        skipped: 0,
        errors: 0,
        details: {
          migrated: [] as string[],
          skipped: [] as { name: string; reason: string }[],
          errors: [] as { name: string; error: string }[]
        },
        modelKeyMapping: new Map<string, string>()
      };

      try {
        // 检查源文件是否存在
        if (!fs.existsSync(sourcePath)) {
          result.message = `AI模型源文件不存在: ${sourcePath}`;
          return result;
        }

        // 读取老版本数据
        const fileContent = await fs.promises.readFile(sourcePath, 'utf-8');
        let legacyData: LegacyAIModelData;

        try {
          legacyData = JSON.parse(fileContent);
        } catch (error) {
          result.message = `无法解析AI模型源文件 JSON: ${error instanceof Error ? error.message : String(error)}`;
          return result;
        }

        if (!legacyData.data || !Array.isArray(legacyData.data)) {
          result.message = "AI模型源文件格式不正确，缺少 data 数组";
          return result;
        }

        // 获取全局应用设置管理器
        const appSettingsManager = getAppSettingsManager();
        const currentSettings = await appSettingsManager.getSettings();

        // 获取现有的 AI 模型列表（用于重复检查）
        const existingModels = currentSettings.ai?.models || [];
        const existingNames = new Set(existingModels.map((model: AIModelConfigItem) => model.name));

        if (dryRun) {
          result.message = "试运行模式 - 不会实际创建 AI 模型";
        }

        const newModels: AIModelConfigItem[] = [...existingModels];

        // 处理每个老版本 AI 模型
        for (const legacyModel of legacyData.data) {
          try {
            // 转换为新格式
            const newModelConfig = convertLegacyAIModelToNewFormat(legacyModel);

            // 检查重复
            if (existingNames.has(newModelConfig.name)) {
              if (!force) {
                result.details.skipped.push({
                  name: newModelConfig.name,
                  reason: "同名AI模型已存在"
                });
                result.skipped++;
                continue;
              } else {
                // 强制模式下删除现有的模型
                if (!dryRun) {
                  const index = newModels.findIndex(m => m.name === newModelConfig.name);
                  if (index >= 0) {
                    newModels.splice(index, 1);
                  }
                }
              }
            }

            // 记录模型 key 映射
            result.modelKeyMapping.set(legacyModel.key, newModelConfig.key);

            // 添加新模型
            if (!dryRun) {
              newModels.push(newModelConfig);
              result.details.migrated.push(newModelConfig.name);
              result.migrated++;
            } else {
              // 试运行模式
              result.details.migrated.push(newModelConfig.name);
              result.migrated++;
            }

          } catch (error) {
            result.details.errors.push({
              name: legacyModel.name || legacyModel.key,
              error: error instanceof Error ? error.message : String(error)
            });
            result.errors++;
          }
        }

        // 保存更新后的设置
        if (!dryRun && result.migrated > 0) {
          const updatedSettings = {
            ...currentSettings,
            ai: {
              ...currentSettings.ai,
              models: newModels
            }
          };

          await appSettingsManager.updateSettings(updatedSettings);
        }

        // 生成结果消息
        if (dryRun) {
          result.message = `AI模型试运行完成: 可迁移 ${result.migrated} 个模型, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        } else {
          result.message = `AI模型迁移完成: 成功迁移 ${result.migrated} 个模型, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        }

        result.success = result.errors === 0;
        return result;

      } catch (error) {
        result.message = `AI模型迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`;
        return result;
      }
    },

    async migrateAgents(params) {
      const {
        sourcePath = path.join(os.homedir(), "Documents", "HyperChat", "gpts_list.json"),
        targetScope = "global",
        dryRun = false,
        force = false,
        modelKeyMapping
      } = params;

      const result = {
        success: false,
        message: "",
        migrated: 0,
        skipped: 0,
        errors: 0,
        details: {
          migrated: [] as string[],
          skipped: [] as { name: string; reason: string }[],
          errors: [] as { name: string; error: string }[]
        }
      };

      try {
        // 检查源文件是否存在
        if (!fs.existsSync(sourcePath)) {
          result.message = `源文件不存在: ${sourcePath}`;
          return result;
        }

        // 读取老版本数据
        const fileContent = await fs.promises.readFile(sourcePath, 'utf-8');
        let legacyData: LegacyAgentData;

        try {
          legacyData = JSON.parse(fileContent);
        } catch (error) {
          result.message = `无法解析源文件 JSON: ${error instanceof Error ? error.message : String(error)}`;
          return result;
        }

        if (!legacyData.data || !Array.isArray(legacyData.data)) {
          result.message = "源文件格式不正确，缺少 data 数组";
          return result;
        }

        // 确保工作区已初始化
        const workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          result.message = "未找到当前工作区";
          return result;
        }

        // 获取现有的 Agent 列表（用于重复检查）
        const existingAgents = await workspace.getAllAgents();
        const existingNames = new Set(existingAgents.map((agent: AgentConfig) => agent.name));

        if (dryRun) {
          result.message = "试运行模式 - 不会实际创建 Agent";
        }

        // 处理每个老版本 Agent
        for (const legacyAgent of legacyData.data) {
          try {
            // 转换为新格式
            const newAgentConfig = convertLegacyAgentToNewFormat(legacyAgent, modelKeyMapping);

            // 验证名称
            if (!isValidAgentName(newAgentConfig.name)) {
              result.details.skipped.push({
                name: newAgentConfig.name,
                reason: "名称不合法"
              });
              result.skipped++;
              continue;
            }

            // 检查重复
            if (existingNames.has(newAgentConfig.name)) {
              if (!force) {
                result.details.skipped.push({
                  name: newAgentConfig.name,
                  reason: "同名 Agent 已存在"
                });
                result.skipped++;
                continue;
              } else {
                // 强制模式下删除现有的 Agent
                if (!dryRun) {
                  await workspace.deleteAgent(newAgentConfig.name);
                }
              }
            }

            // 创建新 Agent
            if (!dryRun) {
              const createdAgent = await workspace.createAgent(newAgentConfig, targetScope);
              if (createdAgent) {
                result.details.migrated.push(newAgentConfig.name);
                result.migrated++;
              } else {
                result.details.errors.push({
                  name: newAgentConfig.name,
                  error: "创建 Agent 失败"
                });
                result.errors++;
              }
            } else {
              // 试运行模式
              result.details.migrated.push(newAgentConfig.name);
              result.migrated++;
            }

          } catch (error) {
            const agentName = legacyAgent.name || legacyAgent.label || legacyAgent.key;
            result.details.errors.push({
              name: agentName,
              error: error instanceof Error ? error.message : String(error)
            });
            result.errors++;
          }
        }

        // 生成结果消息
        if (dryRun) {
          result.message = `试运行完成: 可迁移 ${result.migrated} 个 Agent, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        } else {
          result.message = `迁移完成: 成功迁移 ${result.migrated} 个 Agent, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        }

        result.success = result.errors === 0;
        return result;

      } catch (error) {
        result.message = `Agent迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`;
        return result;
      }
    },

    async migrateMCPConfig(params) {
      const {
        sourcePath = path.join(os.homedir(), "Documents", "HyperChat", "mcp.json"),
        targetScope = "global",
        dryRun = false,
        force = false
      } = params;

      const result = {
        success: false,
        message: "",
        migrated: 0,
        skipped: 0,
        errors: 0,
        details: {
          migrated: [] as string[],
          skipped: [] as { name: string; reason: string }[],
          errors: [] as { name: string; error: string }[]
        }
      };

      try {
        // 检查源文件是否存在
        if (!fs.existsSync(sourcePath)) {
          result.message = `MCP配置源文件不存在: ${sourcePath}`;
          result.success = true; // 没有文件不算错误，只是没有需要迁移的内容
          return result;
        }

        // 读取老版本数据
        const fileContent = await fs.promises.readFile(sourcePath, 'utf-8');
        let legacyData: LegacyMCPData;

        try {
          legacyData = JSON.parse(fileContent);
        } catch (error) {
          result.message = `无法解析MCP配置源文件 JSON: ${error instanceof Error ? error.message : String(error)}`;
          return result;
        }

        if (!legacyData.mcpServers || typeof legacyData.mcpServers !== 'object') {
          result.message = "MCP配置源文件格式不正确，缺少 mcpServers 对象";
          return result;
        }

        // 确保工作区已初始化
        const workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          result.message = "未找到当前工作区";
          return result;
        }

        // 获取现有的 MCP 客户端（用于重复检查）
        const existingClients = await workspace.getMcpClients();
        const existingNames = new Set(existingClients.map((client: any) => client.serverName));

        if (dryRun) {
          result.message = "试运行模式 - 不会实际创建 MCP 配置";
        }

        // 处理每个老版本 MCP 服务器配置
        for (const [serverName, serverConfig] of Object.entries(legacyData.mcpServers)) {
          try {
            // 检查重复
            if (existingNames.has(serverName)) {
              if (!force) {
                result.details.skipped.push({
                  name: serverName,
                  reason: "同名MCP服务器已存在"
                });
                result.skipped++;
                continue;
              } else {
                // 强制模式下删除现有的配置
                if (!dryRun) {
                  await workspace.getMcpManager().deleteServerConfig(serverName);
                  // await workspace.deleteMcpServer(serverName);
                }
              }
            }

            // 添加新的 MCP 配置
            if (!dryRun) {
              await workspace.getMcpManager().setServerConfig(serverName, serverConfig);
              result.details.migrated.push(serverName);
              result.migrated++;
            } else {
              // 试运行模式
              result.details.migrated.push(serverName);
              result.migrated++;
            }

          } catch (error) {
            result.details.errors.push({
              name: serverName,
              error: error instanceof Error ? error.message : String(error)
            });
            result.errors++;
          }
        }

        // 生成结果消息
        if (dryRun) {
          result.message = `MCP配置试运行完成: 可迁移 ${result.migrated} 个服务器, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        } else {
          result.message = `MCP配置迁移完成: 成功迁移 ${result.migrated} 个服务器, 跳过 ${result.skipped} 个, 错误 ${result.errors} 个`;
        }

        result.success = result.errors === 0;
        return result;

      } catch (error) {
        result.message = `MCP配置迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`;
        return result;
      }
    },

    async migrateAll(params) {
      const {
        agentSourcePath = path.join(os.homedir(), "Documents", "HyperChat", "gpts_list.json"),
        modelSourcePath = path.join(os.homedir(), "Documents", "HyperChat", "gpt_models.json"),
        mcpSourcePath = path.join(os.homedir(), "Documents", "HyperChat", "mcp.json"),
        targetScope = "global",
        dryRun = false,
        force = false
      } = params;

      const result = {
        success: false,
        message: "",
        aiModels: {
          migrated: 0,
          skipped: 0,
          errors: 0
        },
        mcpConfig: {
          migrated: 0,
          skipped: 0,
          errors: 0
        },
        agents: {
          migrated: 0,
          skipped: 0,
          errors: 0
        },
        details: {
          aiModels: {
            migrated: [] as string[],
            skipped: [] as { name: string; reason: string }[],
            errors: [] as { name: string; error: string }[]
          },
          mcpConfig: {
            migrated: [] as string[],
            skipped: [] as { name: string; reason: string }[],
            errors: [] as { name: string; error: string }[]
          },
          agents: {
            migrated: [] as string[],
            skipped: [] as { name: string; reason: string }[],
            errors: [] as { name: string; error: string }[]
          }
        }
      };

      try {
        // 获取迁移命令实例
        const migrationCommands = await createMigrationCommands(workspaceManager);

        // 第一步：迁移 AI 模型
        const aiModelResult = await migrationCommands.migrateAIModels({
          sourcePath: modelSourcePath,
          dryRun,
          force
        });

        result.aiModels.migrated = aiModelResult.migrated;
        result.aiModels.skipped = aiModelResult.skipped;
        result.aiModels.errors = aiModelResult.errors;
        result.details.aiModels = aiModelResult.details;

        // 如果 AI 模型迁移失败，停止后续操作
        if (!aiModelResult.success && aiModelResult.errors > 0) {
          result.message = `AI模型迁移失败: ${aiModelResult.message}`;
          return result;
        }

        // 第二步：迁移 MCP 配置
        const mcpResult = await migrationCommands.migrateMCPConfig({
          sourcePath: mcpSourcePath,
          targetScope,
          dryRun,
          force
        });

        result.mcpConfig.migrated = mcpResult.migrated;
        result.mcpConfig.skipped = mcpResult.skipped;
        result.mcpConfig.errors = mcpResult.errors;
        result.details.mcpConfig = mcpResult.details;

        // 如果 MCP 配置迁移失败，停止后续操作
        if (!mcpResult.success && mcpResult.errors > 0) {
          result.message = `MCP配置迁移失败: ${mcpResult.message}`;
          return result;
        }

        // 第三步：使用模型映射迁移 Agent
        const agentResult = await migrationCommands.migrateAgents({
          sourcePath: agentSourcePath,
          targetScope,
          dryRun,
          force,
          modelKeyMapping: aiModelResult.modelKeyMapping
        });

        result.agents.migrated = agentResult.migrated;
        result.agents.skipped = agentResult.skipped;
        result.agents.errors = agentResult.errors;
        result.details.agents = agentResult.details;

        // 生成总结消息
        const totalMigrated = result.aiModels.migrated + result.mcpConfig.migrated + result.agents.migrated;
        const totalSkipped = result.aiModels.skipped + result.mcpConfig.skipped + result.agents.skipped;
        const totalErrors = result.aiModels.errors + result.mcpConfig.errors + result.agents.errors;

        if (dryRun) {
          result.message = `完整迁移试运行完成: 可迁移 ${totalMigrated} 项 (AI模型: ${result.aiModels.migrated}, MCP配置: ${result.mcpConfig.migrated}, Agent: ${result.agents.migrated}), 跳过 ${totalSkipped} 项, 错误 ${totalErrors} 项`;
        } else {
          result.message = `完整迁移完成: 成功迁移 ${totalMigrated} 项 (AI模型: ${result.aiModels.migrated}, MCP配置: ${result.mcpConfig.migrated}, Agent: ${result.agents.migrated}), 跳过 ${totalSkipped} 项, 错误 ${totalErrors} 项`;
        }

        result.success = totalErrors === 0;
        return result;

      } catch (error) {
        result.message = `完整迁移过程中发生错误: ${error instanceof Error ? error.message : String(error)}`;
        return result;
      }
    }
  };
}