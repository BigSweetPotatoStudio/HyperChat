import { initHttp, urlPrefix, routers } from "../../../core/src/http.mjs";
import { createElectronCommandRouter } from "./electronCommandRouter.mjs";
import { Logger } from "../../../core/src/log.mjs";

/**
 * 定义 callElectron API 路径
 */
export const callElectronApiPath = urlPrefix + "/callElectron";

/**
 * Electron 扩展的 HTTP 服务器初始化
 * 通过 Core 的 routers 机制注册 Electron 特有的路由
 */
export async function initElectronHttp() {
  Logger.info(`Registering Electron routes with prefix: ${callElectronApiPath}`);

  // 通过 Core 的 routers 机制注册 Electron 命令路由
  routers.push({
    prefix: callElectronApiPath,
    router: createElectronCommandRouter()
  });

  Logger.info('Electron routes registered to Core router system');

  // 初始化 Core 的 HTTP 服务器（现在包含 Electron 路由）
  await initHttp();

  Logger.info('Electron HTTP server initialized successfully');
}