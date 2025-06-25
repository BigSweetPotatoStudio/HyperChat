const HTTPPORT = 16100;
const MCPServerPORT = 16110;
export const Config = {
  port: HTTPPORT,
  mcp_server_port: MCPServerPORT,
};
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);