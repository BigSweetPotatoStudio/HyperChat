export const zx = await import(/* webpackIgnore: true */ "zx");

export const { $, usePowerShell, os, fs } = zx;
export const { shellPathSync } = await import(
  /* webpackIgnore: true */ "shell-path"
);

export const { createClient } = await import(
  /* webpackIgnore: true */ "webdav"
);

export const { Server } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/index.js"
);
export const { SSEServerTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/sse.js"
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
