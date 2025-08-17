import { Request, Response, NextFunction, Router } from "express";
import { ElectronCommand } from "../command.mjs";
import { Logger } from "../../../core/src/log.mjs";

/**
 * Electron 命令路由生成器
 * 基于 ElectronCommand 类的方法自动生成 REST API 路由
 * 每个 ElectronCommand 方法对应一个 POST 接口
 * 路径前缀为 /callElectron/
 * 
 * @param electronCommandInstance - ElectronCommand 类实例
 * @returns Express Router 实例
 */
export function genElectronRouter(electronCommandInstance: typeof ElectronCommand): Router {
    const router = Router();

    // 获取 ElectronCommand 类的所有方法名（从原型获取，排除构造函数）
    const functionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(electronCommandInstance))
        .filter(name => name !== "constructor" && typeof (electronCommandInstance as any)[name] === "function");

    Logger.info(`Registering Electron commands: ${functionNames.join(', ')}`);

    // 为每个 ElectronCommand 方法生成对应的 POST 路由
    for (const methodName of functionNames) {
        router.post(`/${methodName}`, async (req: Request, res: Response, _next: NextFunction) => {
            const startTime = Date.now();
            const args = req.body;

            try {
                // 记录 Electron 命令调用日志
                Logger.info(`Electron.${methodName}:`, args);

                // 调用 ElectronCommand 方法处理请求
                const result = await (ElectronCommand[methodName as keyof typeof ElectronCommand] as any)(...(Array.isArray(args) ? args : [args]));

                const duration = Date.now() - startTime;
                if (process.env.myEnv === "dev" && duration > 1000) {
                    Logger.warn(`Slow Electron API call: ${methodName} took ${duration}ms`);
                }

                // 返回统一格式的成功响应
                res.json({
                    code: 0,
                    success: true,
                    data: result,
                });
            } catch (error: any) {
                const duration = Date.now() - startTime;
                Logger.error(`Electron API Error in ${methodName} (${duration}ms):`, error);

                res.status(500).json({
                    success: false,
                    code: 1,
                    message: process.env.myEnv === "dev"
                        ? (error instanceof Error ? error.message : 'Unknown error')
                        : 'Electron command error'
                });
            }
        });
    }

    return router;
}

/**
 * 创建 callElectron 路由
 * 统一的 Electron 命令调用入口
 */
export function createElectronCommandRouter(): Router {
    return genElectronRouter(ElectronCommand);
}