import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import type { CustomFetch } from "@dadigua/hyperchat-shared";
import { Logger } from "../../log.mjs";

/**
 * 代理工具类
 * 处理HTTP代理配置和SSL验证设置
 */
export class ProxyUtils {
  /**
   * 检查是否配置了代理
   */
  static isProxyConfigured(): boolean {
    const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy ||
      process.env.HTTPS_PROXY || process.env.https_proxy;
    return !!proxyUrl;
  }

  /**
   * 获取代理URL
   */
  static getProxyUrl(): string | undefined {
    return process.env.HTTP_PROXY || process.env.http_proxy ||
      process.env.HTTPS_PROXY || process.env.https_proxy;
  }

  /**
   * 检查是否应该跳过SSL验证
   */
  static shouldSkipSslVerification(): boolean {
    return process.env.HYPERCHAT_SKIP_SSL_VERIFICATION === 'true';
  }

  /**
   * 配置全局SSL设置
   */
  static configureGlobalSsl(): void {
    const skipSslVerification = this.shouldSkipSslVerification();
    if (skipSslVerification) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      Logger.warn('SSL verification skip');
    }
  }

  /**
   * 创建支持代理的自定义fetch函数
   */
  static createProxyFetch(): CustomFetch {
    const proxyUrl = this.getProxyUrl();
    if (!proxyUrl) {
      throw new Error('No proxy URL configured');
    }

    this.configureGlobalSsl();

    return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const targetUrl = typeof url === 'string' ? url : url.toString();
      const isHttps = targetUrl.startsWith('https:');
      const skipSslVerification = this.shouldSkipSslVerification();

      // 创建代理 agent，根据配置决定是否跳过SSL验证
      const httpsOptions = skipSslVerification ? {
        rejectUnauthorized: false,  // 允许自签名证书
      } : {};

      const agent = isHttps
        ? new HttpsProxyAgent(proxyUrl, httpsOptions)
        : new HttpProxyAgent(proxyUrl);

      // 准备fetch选项
      const fetchOptions: any = {
        ...init,
        agent: agent,
      };

      // 只在配置了跳过SSL验证时添加这些选项
      if (skipSslVerification && isHttps) {
        fetchOptions.rejectUnauthorized = false;
        fetchOptions.checkServerIdentity = () => undefined;
      }

      // 使用 node-fetch，它对代理支持更好
      const response = await nodeFetch(targetUrl, fetchOptions);

      // 将 node-fetch 的 Response 转换为标准 Response
      const body = await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as any,
      }) as Response;
    };
  }

  /**
   * 创建fetch函数（如果有代理则使用代理，否则使用默认）
   */
  static createFetch(): CustomFetch | undefined {
    if (this.isProxyConfigured()) {
      return this.createProxyFetch();
    }
    return undefined;
  }
}