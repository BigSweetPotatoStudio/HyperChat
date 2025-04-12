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

export const { SSEClientTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/sse.js"
);
export const { Server } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/index.js"
);
export const { SSEServerTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/sse.js"
);



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
  ResourceListChangedNotificationSchema
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
