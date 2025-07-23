/**
 * 应用配置常量定义
 * 
 * 核心功能：
 * - 定义 HyperChat 应用的网络端口配置
 * - 提供 HTTP 服务器和 MCP 服务器的默认端口
 * - 集成环境变量管理系统
 * 
 * 端口说明：
 * - HyperChat_HTTP_PORT: 主 HTTP 服务器端口，用于 Web 前端访问
 * 
 * 使用场景：
 * - HTTP 服务器启动时的默认端口配置
 * - MCP 服务器实例化时的端口分配
 * - 前端连接时的端口引用
 */

import { argv, fs, os, path } from "zx";
import p from "../package.json" with { type: "json" };
import { envManager } from "./data/managers/envManager.mjs";

/**
 * 应用配置对象
 * 
 * 包含应用运行时需要的核心配置参数
 * 主要用于服务器启动和网络连接配置
 */
export const Config = {
  /** HTTP 服务器端口（从环境变量获取） */
  get port() {
    return envManager.get('HyperChat_HTTP_PORT');
  },
};


export const dirName = "HyperChat";

/**
 * 获取应用数据目录
 * 优先使用环境变量配置，fallback 到默认路径
 */
function getAppDataDir(): string {
  const config = envManager.getConfig();
  
  if (config.HyperChat_AppDataDir) {
    return config.HyperChat_AppDataDir;
  }
  
  // 默认路径
  return path.join(os.homedir(), "Documents", dirName);
}

// 动态获取应用数据目录
export const appDataDir = getAppDataDir();

// 确保目录存在
fs.ensureDirSync(appDataDir);

export const CONST = {
  getVersion: p.version,
  get appDataDir() {
    return getAppDataDir();
  },
  dirName: dirName,
};