/**
 * HTTP 请求封装模块
 * 
 * 核心功能：
 * - 提供统一的 HTTP 请求接口
 * - 自动处理查询参数序列化
 * - 支持 JSON 请求体自动处理
 * - 基于环境变量的基础 URL 配置
 * 
 * 依赖关系：
 * - querystring: Node.js 内置查询字符串处理
 * - zx: 现代化的脚本执行库（提供 fetch）
 * 
 * 配置说明：
 * - 基础 URL 通过 REACT_APP_BASE_URL 环境变量配置
 * - 默认回退到 http://localhost:5000
 * 
 * 使用场景：
 * - 与后端 API 的统一请求接口
 * - 微服务间的内部通信
 * - 第三方 API 调用
 */

import querystring from "querystring";
import { fetch } from "zx";

// 调试信息：显示当前环境和配置
console.log("NODE_ENV: ", process.env.NODE_ENV);
let BASE_URL = "";

// 从环境变量获取基础 URL，支持开发和生产环境的不同配置
BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

console.log(BASE_URL);

/**
 * 统一的 HTTP 请求函数
 * 
 * 提供简化的请求接口，自动处理常见的请求格式
 * 
 * @param url - 请求的相对路径（相对于 BASE_URL）
 * @param options - 请求选项对象
 * @param options.query - 查询参数对象，将自动序列化为 URL 参数
 * @param options.json - JSON 请求体，将自动设置 Content-Type 和序列化
 * @returns Promise<any> - 返回解析后的 JSON 响应
 * 
 * @example
 * ```typescript
 * // GET 请求带查询参数
 * const data = await request('/api/users', {
 *   query: { page: 1, limit: 10 }
 * });
 * 
 * // POST 请求带 JSON 数据
 * const result = await request('/api/users', {
 *   method: 'POST',
 *   json: { name: 'John', email: 'john@example.com' }
 * });
 * ```
 */
export async function request(url: string, options = {} as any) {
  // 处理查询参数：如果 URL 中没有查询参数且 options.query 存在，则添加查询参数
  if (!url.includes("?")) {
    let querystr = querystring.stringify(options.query);
    url = url + (querystr ? "?" + querystr : "");
  }
  
  // 处理 JSON 请求体：自动设置 Content-Type 并序列化 JSON 数据
  if (options.json) {
    options = Object.assign({}, options, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.json),
    });
  }
  
  // 发送请求并解析 JSON 响应
  return fetch(BASE_URL + url, options).then((res) => res.json());
}
