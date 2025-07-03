/**
 * A generic type representing a map of event names to their argument arrays.
 * @example
 * type MyEvents = {
 *   'user:login': [userId: string];
 *   'data:loaded': [data: { id: number }];
 * };
 */
export type EventMap = Record<string, any[]>;

/**
 * A generic type for an event callback function.
 */
export type EventCallback<T extends any[]> = (...args: T) => void;

/**
 * Represents a function that handles an event, with an optional 'once' flag.
 */
interface InternalCallback<T extends any[]> extends EventCallback<T> {
  once?: boolean;
}

/**
 * Defines the interface for the event emitter returned by `createEvent`.
 * @template T - An EventMap defining the events and their payloads.
 */
export interface EventEmitter<T extends EventMap> {
  name: string;
  holds: Partial<{ [K in keyof T]: T[K][] }>;
  callbacks: Partial<{ [K in keyof T]: InternalCallback<T[K]>[] }>;
  clearAll(): void;
  clear<K extends keyof T>(name: K): void;
  clearCallBack<K extends keyof T>(name: K): void;
  clearHolds<K extends keyof T>(name: K): void;
  on<K extends keyof T>(name: K, callback: EventCallback<T[K]>): this;
  onPromise<K extends keyof T>(name: K): Promise<T[K][0]>;
  off<K extends keyof T>(name: K, callback: EventCallback<T[K]>): this;
  fire<K extends keyof T>(name: K, ...args: T[K]): this;
  fireHold<K extends keyof T>(name: K, ...args: T[K]): this;
  clearAndFireHold<K extends keyof T>(name: K, ...args: T[K]): void;
  once<K extends keyof T>(name: K, callback: EventCallback<T[K]>): this;
  hasEvent<K extends keyof T>(name: K): boolean;
}

/**
 * Creates a new, type-safe event emitter instance.
 * @template T - An EventMap defining the events and their payloads.
 * @param {string} name - The name of the event emitter, for debugging purposes.
 * @returns {EventEmitter<T>} A new event emitter instance.
 */
export function createEvent<T extends EventMap>(name: string): EventEmitter<T> {
  type EventKey = keyof T;

  const holds: Partial<{ [K in EventKey]: T[K][] }> = {};
  const callbacks: Partial<{ [K in EventKey]: InternalCallback<T[K]>[] }> = {};

  const event: EventEmitter<T> = {
    name,
    holds: holds as any,
    callbacks: callbacks as any,

    /** Clears all registered callbacks and held arguments. */
    clearAll() {
      for (const key in callbacks) delete callbacks[key];
      for (const key in holds) delete holds[key];
    },

    /** Clears all callbacks and held arguments for a specific event. */
    clear<K extends EventKey>(name: K) {
      delete callbacks[name];
      delete holds[name];
    },

    /** Clears all callbacks for a specific event. */
    clearCallBack<K extends EventKey>(name: K) {
      delete callbacks[name];
    },

    /** Clears all held arguments for a specific event. */
    clearHolds<K extends EventKey>(name: K) {
      delete holds[name];
    },

    /** Registers an event listener. If there are held arguments, they are fired immediately. */
    on<K extends EventKey>(name: K, callback: EventCallback<T[K]>) {
      if (!callbacks[name]) {
        callbacks[name] = [];
      }
      callbacks[name]!.push(callback);

      // Fire any held events
      if (holds[name]) {
        let args;
        while ((args = holds[name]!.shift())) {
          this.fire(name, ...args);
        }
      }
      return this;
    },

    /** Returns a promise that resolves the next time the event is fired. */
    onPromise<K extends EventKey>(name: K): Promise<T[K][0]> {
      return new Promise((resolve) => {
        const onceCallback: InternalCallback<T[K]> = (...args) => {
          resolve(args[0]);
        };
        onceCallback.once = true;
        this.on(name, onceCallback as EventCallback<T[K]>);
      });
    },

    /** Unregisters an event listener. */
    off<K extends EventKey>(name: K, callback: EventCallback<T[K]>) {
      if (this.hasEvent(name)) {
        const index = callbacks[name]!.findIndex((x) => x === callback);
        if (index > -1) {
          callbacks[name]!.splice(index, 1);
        }
      }
      return this;
    },

    /** Fires an event, calling all registered listeners with the provided arguments. */
    fire<K extends EventKey>(name: K, ...args: T[K]) {
      if (this.hasEvent(name)) {
        const listeners = [...callbacks[name]!]; // Create a copy to handle removals during iteration
        for (let i = 0; i < listeners.length; i++) {
          const callback = listeners[i];
          if (callback.once) {
            this.off(name, callback as EventCallback<T[K]>);
          }
          callback.apply({}, args);
        }
      }
      return this;
    },

    /**
     * Fires an event if listeners are present. If not, holds the arguments
     * until a listener is registered.
     */
    fireHold<K extends EventKey>(name: K, ...args: T[K]) {
      if (this.hasEvent(name)) {
        this.fire(name, ...args);
      } else {
        if (!holds[name]) {
          holds[name] = [];
        }
        holds[name]!.push(args);
      }
      return this;
    },

    /** Clears any previously held arguments and then fires or holds the new ones. */
    clearAndFireHold<K extends EventKey>(name: K, ...args: T[K]) {
      this.clearHolds(name);
      this.fireHold(name, ...args);
    },

    /** Registers a one-time event listener. */
    once<K extends EventKey>(name: K, callback: EventCallback<T[K]>) {
      const onceCallback = callback as InternalCallback<T[K]>;
      onceCallback.once = true;
      this.on(name, onceCallback as EventCallback<T[K]>);
      return this;
    },

    /** Checks if there are any listeners for a specific event. */
    hasEvent<K extends EventKey>(name: K) {
      return name in callbacks && callbacks[name]!.length > 0;
    },
  };
  return event;
}

/**
 * A global event emitter for application-wide communication.
 * TODO: For better type safety, define a GlobalEvents interface extending EventMap
 * and use it here, e.g., `createEvent<GlobalEvents>('global')`.
 * 
 * @example
 * interface GlobalEvents extends EventMap {
 *   'userLoggedIn': [userId: string];
 *   'themeChanged': [theme: 'dark' | 'light'];
 * }
 * export const EVENT = createEvent<GlobalEvents>('global');
 */
export const EVENT = createEvent<any>('global');