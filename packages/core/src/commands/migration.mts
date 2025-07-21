import { createMigrationCommands } from "./migrationCommands.mjs";
import { workspaceManager } from "../workspace/index.mjs";

/**
 * 迁移相关命令
 */
export const migrationCommands = {
  "migration.migrateAIModels": async (params: {
    sourcePath?: string;
    dryRun?: boolean;
    force?: boolean;
  }) => {
    const migration = await createMigrationCommands(workspaceManager);
    return await migration.migrateAIModels(params);
  },

  "migration.migrateAgents": async (params: {
    sourcePath?: string;
    targetScope?: "global" | "workspace";
    dryRun?: boolean;
    force?: boolean;
    modelKeyMapping?: Map<string, string>;
  }) => {
    const migration = await createMigrationCommands(workspaceManager);
    return await migration.migrateAgents(params);
  },

  "migration.migrateMCPConfig": async (params: {
    sourcePath?: string;
    targetScope?: "global" | "workspace";
    dryRun?: boolean;
    force?: boolean;
  }) => {
    const migration = await createMigrationCommands(workspaceManager);
    return await migration.migrateMCPConfig(params);
  },

  "migration.migrateAll": async (params: {
    agentSourcePath?: string;
    modelSourcePath?: string;
    mcpSourcePath?: string;
    targetScope?: "global" | "workspace";
    dryRun?: boolean;
    force?: boolean;
  }) => {
    const migration = await createMigrationCommands(workspaceManager);
    return await migration.migrateAll(params);
  }
};

// 类型定义
export type MigrationCommandsType = typeof migrationCommands;