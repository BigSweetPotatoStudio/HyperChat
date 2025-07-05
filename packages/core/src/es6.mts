// es6.mts 封装了后端常用依赖和工具的动态导入，便于主流程统一调用
// 包括 zx、shell-path、webdav、MCP 协议、chrome-launcher 等

export const zx = await import(/* webpackIgnore: true */ "zx");

export const { $, usePowerShell, os, fs } = zx;
export const { shellPathSync } = await import(
  /* webpackIgnore: true */ "shell-path"
);

export const { createClient } = await import(
  /* webpackIgnore: true */ "webdav"
);

export const { McpServer } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/mcp.js"
);

export const { getDefaultEnvironment } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/stdio.js"
);

export const ChromeLauncher = await import(
  /* webpackIgnore: true */ "chrome-launcher"
);

export const { Client } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/index.js"
);
export const { StdioClientTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/stdio.js"
);
export const { SSEClientTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/sse.js"
);
export const { Server } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/index.js"
);
export const { SSEServerTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/sse.js"
);
export const { StreamableHTTPServerTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/streamableHttp.js"
);
export const { StreamableHTTPClientTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/streamableHttp.js"
);

export const { InMemoryTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/inMemory.js"
);

// 统一导出各类协议 schema，便于后端主流程调用
export const {
  ListToolsResultSchema,
  CallToolRequestSchema,
  CallToolResultSchema,
  CompatibilityCallToolResultSchema,

  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,

  NotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceListChangedNotificationSchema,
  isInitializeRequest,

} = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/types.js"
);

export const { RAGApplicationBuilder, TextLoader } = await import(
  /* webpackIgnore: true */ "@llm-tools/embedjs"
);

export const { OpenAiEmbeddings } = await import(
  /* webpackIgnore: true */ "@llm-tools/embedjs-openai"
);

export const { LibSqlDb } = await import(
  /* webpackIgnore: true */ "@llm-tools/embedjs-libsql"
);

export const { PdfLoader } = await import(
  /* webpackIgnore: true */ "@llm-tools/embedjs-loader-pdf"
);

const stripModule = await import(/* webpackIgnore: true */ "strip-ansi");

export const strip = stripModule.default;
