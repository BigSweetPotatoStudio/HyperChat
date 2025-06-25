export function createEvent<T extends string>(name: string) {

    let event = {
        name,
        holds: {} as {
            [key: string]: Array<any>
        },
        callbacks: {} as {
            [key: string]: Array<Function>
        },
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
        on(name: T, callback: any) {
            if (event.hasEvent(name)) {
                this.callbacks[name].push(callback);
            } else {
                this.callbacks[name] = [callback];
            }
            if (event.holds[name] != null) {
                let args;
                while (args = event.holds[name].shift()) {
                    event.fire(name, ...args)
                }
            }
            return event;
        },
        onPromise(name: T) {

            return new Promise((resolve, reject) => {
                event.on(name, (data) => {
                    resolve(data)
                })
            })
        },
        off(name: T, callback: any) {
            if (event.hasEvent(name)) {
                const index = this.callbacks[name].findIndex(x => x === callback);
                this.callbacks[name].splice(index, 1);
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
        fire(name: T, ...args) {

            if (event.hasEvent(name)) {
                for (let i = 0; i < this.callbacks[name].length; i++) {
                    let callback = this.callbacks[name][i];
                    if (callback.once) {
                        this.callbacks[name].splice(i, 1);
                        i--;
                    }
                    callback.apply({}, args);
                }
            }
            return event;
        },
        fireHold(name: T, ...args) {
            if (event.hasEvent(name)) {
                this.callbacks[name].forEach((x,) => {
                    x.apply(window, args);
                });
            } else {
                if (event.holds[name] == null) {
                    event.holds[name] = []
                }
                event.holds[name].push(
                    args
                );
            }
            return event;
        },
        clearAndFireHold(name: T, ...args) {
            event.clearHolds(name);
            event.fireHold(name, ...args);
        },
        fireHoldOnce(name: T, ...args) {
            if (event.hasEvent(name)) {
                const waitMoves: any[] = [];
                this.callbacks[name].forEach((x, index) => {
                    x.apply(this, args);
                    // tslint:disable-next-line:no-unused-expression
                    (x as any).once && waitMoves.push(index);
                });
                let t;
                // tslint:disable-next-line:no-conditional-assignment
                while (t = waitMoves.pop(), t != null) {
                    this.callbacks[name].splice(t, 1);
                }
            } else {
                if (event.holds[name] == null) {
                    event.holds[name] = []
                }
                event.holds[name].push(
                    args
                );
            }
            return event;
        },
        once(name: T, callback: any) {
            callback.once = true;
            this.on(name, callback);
            return event;
        },
        hasEvent(name: T) {
            return name in this.callbacks && this.callbacks[name].length > 0;
        }
    };
    return event;
}

export const EVENT = createEvent<any>('globle');