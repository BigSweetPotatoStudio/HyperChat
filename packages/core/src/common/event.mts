/**
 * 事件系统模块
 * 
 * 核心功能：
 * - 提供灵活的事件发布/订阅机制
 * - 支持事件保持（hold）功能
 * - 支持一次性事件监听
 * - 支持 Promise 化的事件等待
 * - 提供完整的事件生命周期管理
 * 
 * 特色功能：
 * - fireHold: 如果没有监听器时保持事件，有监听器时立即触发
 * - once: 一次性事件监听，触发后自动移除
 * - onPromise: 将事件转换为 Promise 形式
 * - 类型安全的事件名称约束
 * 
 * 使用场景：
 * - 组件间的松耦合通信
 * - 异步流程的事件协调
 * - 模块间状态同步
 * - 用户界面事件处理
 * 
 * @template T - 事件名称类型，通常为字符串字面量联合类型
 */

import { Logger } from "../log.mjs";
import type { EventCallback, EventCallbackWithOnce, EventHoldsMap, EventCallbacksMap } from "@dadigua/hyperchat-shared/types";

/**
 * 创建类型安全的事件管理器
 * 
 * @param name - 事件管理器的名称，用于调试和标识
 * @returns 事件管理器实例
 * 
 * @example
 * ```typescript
 * // 创建类型安全的事件管理器
 * type AppEvents = 'user-login' | 'data-updated' | 'error-occurred';
 * const appEvent = createEvent<AppEvents>('app');
 * 
 * // 监听事件
 * appEvent.on('user-login', (user) => {
 *   Logger.info('用户登录:', user);
 * });
 * 
 * // 触发事件
 * appEvent.fire('user-login', { id: 1, name: 'John' });
 * ```
 */
export function createEvent<T extends string>(name: string) {

    let event = {
        name,
        holds: {} as EventHoldsMap,
        callbacks: {} as EventCallbacksMap,
        clearAll() {
            this.callbacks = {}
            this.holds = {}
        },
        clear(name: T) {
            this.callbacks[name] = [];
            this.holds[name] = [];
        },
        clearCallBack(name: T) {
            this.callbacks[name] = [];
        },
        clearHolds(name: T) {
            this.holds[name] = [];
        },
        on(name: T, callback: EventCallbackWithOnce) {
            if (event.hasEvent(name)) {
                this.callbacks[name]?.push(callback);
            } else {
                this.callbacks[name] = [callback];
            }
            if (event.holds[name] != null) {
                let args;
                while (args = event.holds[name]?.shift()) {
                    event.fire(name, ...args)
                }
            }
            return event;
        },
        onPromise(name: T) {

            return new Promise((resolve, _reject) => {
                event.on(name, (data: unknown) => {
                    resolve(data)
                })
            })
        },
        off(name: T, callback: EventCallbackWithOnce) {
            if (event.hasEvent(name)) {
                const index = this.callbacks[name]?.findIndex(x => x === callback);
                if (index !== undefined && index !== -1) {
                    this.callbacks[name]?.splice(index, 1);
                }
            }
            return event;
        },
        // fireOnce(name: T, ...args) {
        //     if (event.hasEvent(name)) {
        //         const waitMoves: any[] = [];
        //         this.callbacks[name].forEach((x, index) => {
        //             x.apply(this, args);
        //             // tslint:disable-next-line:no-unused-expression
        //             (x as any).once && waitMoves.push(index);
        //         });
        //         let t;
        //         // tslint:disable-next-line:no-conditional-assignment
        //         while (t = waitMoves.pop()) {
        //             this.callbacks[name].splice(t, 1);
        //         }
        //     }
        //     return event;
        // },
        fire(name: T, ...args: unknown[]) {
            if (event.hasEvent(name)) {
                const callbacks = this.callbacks[name];
                if (callbacks) {
                    for (let i = 0; i < callbacks.length; i++) {
                        let callback = callbacks[i];
                        if (callback && callback.once) {
                            callbacks.splice(i, 1);
                            i--;
                        }
                        if (callback) {
                            callback.apply({}, args);
                        }
                    }
                }
            }
            return event;
        },
        fireHold(name: T, ...args: unknown[]) {
            if (event.hasEvent(name)) {
                this.callbacks[name]?.forEach((x) => {
                    x.apply(globalThis, args);
                });
            } else {
                if (event.holds[name] == null) {
                    event.holds[name] = []
                }
                event.holds[name]?.push(args);
            }
            return event;
        },
        clearAndFireHold(name: T, ...args: unknown[]) {
            event.clearHolds(name);
            event.fireHold(name, ...args);
        },
        fireHoldOnce(name: T, ...args: unknown[]) {
            if (event.hasEvent(name)) {
                const waitMoves: number[] = [];
                this.callbacks[name]?.forEach((x, index) => {
                    x.apply(this, args);
                    // tslint:disable-next-line:no-unused-expression
                    x.once && waitMoves.push(index);
                });
                let t;
                // tslint:disable-next-line:no-conditional-assignment
                while (t = waitMoves.pop(), t != null) {
                    this.callbacks[name]?.splice(t, 1);
                }
            } else {
                if (event.holds[name] == null) {
                    event.holds[name] = []
                }
                event.holds[name]?.push(args);
            }
            return event;
        },
        once(name: T, callback: EventCallback) {
            (callback as EventCallbackWithOnce).once = true;
            this.on(name, callback);
            return event;
        },
        hasEvent(name: T) {
            return name in this.callbacks && (this.callbacks[name]?.length || 0) > 0;
        }
    };
    return event;
}

export const EVENT = createEvent<string>('globle');