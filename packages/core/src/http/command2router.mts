import { Request, Response, NextFunction, Router } from "express";
import { Command } from "../command.mjs";
import { Logger } from "../log.mjs";

/**
 * 动态路由生成器
 * 基于 Command 类的方法自动生成 REST API 路由
 * 每个 Command 方法对应一个 POST 接口
 * 
 * @param commandInstance - Command 类实例
 * @returns Express Router 实例
 */
export function genRouter(commandInstance: any): Router {
    const router = Router();

    // 获取 Command 类的所有方法名（排除构造函数）
    const functionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(commandInstance))
        .filter(name => name !== "constructor" && typeof commandInstance[name] === "function");

    // 为每个 Command 方法生成对应的 POST 路由
    for (const methodName of functionNames) {
        router.post(`/${methodName}`, async (req: Request, res: Response, _next: NextFunction) => {
            const startTime = Date.now();
            const args = req.body;

            try {
                // 选择性日志记录（避免敏感信息和过多日志）
                if (methodName !== "getHistory") {
                    if (methodName === "writeFile") {
                        Logger.info(`${methodName}:`, args[0], `writeFile Data length: ${args[1]?.length || 0}`);
                    } else {
                        Logger.info(`${methodName}:`, args);
                    }
                }

                // 调用 Command 方法处理请求
                const result = await (Command[methodName as keyof typeof Command] as any)(args);

                const duration = Date.now() - startTime;
                if (process.env.myEnv === "dev" && duration > 1000) {
                    Logger.warn(`Slow API call: ${methodName} took ${duration}ms`);
                }

                // 返回统一格式的成功响应
                res.json({
                    code: 0,
                    success: true,
                    data: result,
                });
            } catch (error: any) {
                const duration = Date.now() - startTime;
                Logger.error(`API Error in ${methodName} (${duration}ms):`, error);

                res.status(500).json({
                    success: false,
                    code: 1,
                    message: process.env.myEnv === "dev"
                        ? (error instanceof Error ? error.message : 'Unknown error')
                        : 'Internal server error'
                });
            }
        });
    }

    return router;
}
