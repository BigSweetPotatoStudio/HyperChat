import type { Command } from "../../../core/src/command.mts";
import type { ElectronCommand } from "../../../electron/src/command.mts";
import { io, Socket } from "socket.io-client";
import { sleep } from "./sleep";

/**
 * Represents the response structure for API calls.
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Defines the interface for the extension object (`ext`) used for backend communication.
 */
interface Ext {
  /**
   * Sends a command to the backend.
   * @param command The name of the command to execute.
   * @param args The arguments for the command.
   * @param options Optional settings, like an AbortSignal.
   */
  call: <K extends keyof Command>(
    command: K,
    args: any,
    options?: { signal?: AbortSignal }
  ) => Promise<ReturnType<Command[K]>>

  callElectron: <K extends keyof ElectronCommand>(
    command: K,
    args: any,
    options?: { signal?: AbortSignal }
  ) => Promise<ReturnType<ElectronCommand[K]>>

  /**
   * Registers a listener for messages from the backend.
   * @param channel The channel to listen on.
   * @param listener The callback function to execute when a message is received.
   */
  receive: (channel: string, listener: (data: any) => void) => void;
}

const ext: Ext = {} as any;
globalThis.ext = ext;

let websocket: Socket | undefined = undefined;
let URL_PRE: string;

/**
 * Gets the base URL prefix for API calls.
 * @returns {string} The base URL.
 */
export function getURL_PRE() {
  if (URL_PRE.endsWith("/")) {
    URL_PRE = URL_PRE.slice(0, -1);
  } else {
    return URL_PRE;
  }
}

{
  // In a browser context, determine the base URL.
  URL_PRE = location.origin + location.pathname.replace("index.html", "");

  // Override URL for local development environment.
  if (process.env.myEnv === "dev") {
    URL_PRE = "http://localhost:16100/123456";
  }

  // Define the 'invert' method for making API calls via fetch.
  ext.call = call;
  ext.callElectron = callElectron;

  const callbacks: Record<string, Array<(data: any) => void>> = {};

  // Define the 'receive' method for handling incoming WebSocket messages.
  ext.receive = (channel: string, listener: (data: any) => void) => {
    if (callbacks[channel]) {
      callbacks[channel].push(listener);
    } else {
      callbacks[channel] = [listener];
    }
  };

  // Initialize WebSocket connection.
  const socket = io(getURL_PRE() + "/main-message");
  socket.on("connect", () => {
    console.log("WebSocket connected");
    websocket = socket;
  });

  socket.on("message-from-main", (data: any) => {
    if (process.env.myEnv === "dev") {
      console.log("Received message:", data);
    }
    if (callbacks["message-from-main"]) {
      for (const callback of callbacks["message-from-main"]) {
        callback(data);
      }
    }
  });
}


/**
 * Makes a generic API call to the core backend.
 * @template k - The key of the command in the `Command` interface.
 * @param {k} command - The name of the command to execute.
 * @param {Parameters<Command[k]>[0]} [args={}] - The arguments for the command.
 * @param {{ signal?: AbortSignal }} [options={}] - Optional request options, like an AbortSignal.
 * @returns {Promise<ReturnType<Command[k]>>} A promise that resolves with the command's return value.
 * @throws {Error} If the API call fails or returns an error.
 */
export async function call<k extends keyof Command>(
  command: k,
  args: Parameters<Command[k]>[0] = {} as any,
  options: { signal?: AbortSignal } = {}
): Promise<ReturnType<Command[k]>> {
  try {
    const { signal } = options;
    const res = await fetch(`${getURL_PRE()}/call/${command}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: signal,
    }).then((res) => res.json());
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    console.error(command, args, e);
    throw e;
  }
}

/**
 * Makes a specific API call to the Electron main process.
 * @template k - The key of the command in the `ElectronCommand` interface.
 * @param {k} command - The name of the command to execute.
 * @param {Parameters<ElectronCommand[k]>[0]} [args={}] - The arguments for the command.
 * @param {{ signal?: AbortSignal }} [options={}] - Optional request options, like an AbortSignal.
 * @returns {Promise<ReturnType<ElectronCommand[k]>>} A promise that resolves with the command's return value.
 * @throws {Error} If the API call fails or returns an error.
 */
export async function callElectron<k extends keyof ElectronCommand>(
  command: k,
  args: Parameters<ElectronCommand[k]>[0] = {} as any,
  options: { signal?: AbortSignal } = {}
): Promise<ReturnType<ElectronCommand[k]>> {
  try {
    const { signal } = options;
    const res = await fetch(`${getURL_PRE()}/Electron/${command}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: signal,
    }).then((res) => res.json());
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    console.error(command, args, e);
    throw e;
  }
}

/**
 * Registers a listener for a specific message channel from the backend.
 * @param {string} channel - The name of the channel to listen to.
 * @param {(data: any) => void} listener - The callback function to handle incoming data.
 */
export async function msg_receive(
  channel: string,
  listener: (data: any) => void
) {
  ext.receive(channel, listener);
}

/**
 * Asynchronously gets the WebSocket instance, waiting for it to connect if necessary.
 * @returns {Promise<Socket>} A promise that resolves with the connected WebSocket instance.
 */
export async function getWebSocket() {
  while (websocket == null) {
    await sleep(500);
  }
  return websocket;
}

export { ext };