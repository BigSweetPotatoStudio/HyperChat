import type { Command } from "../../../electron/ts/command.mts";
import { io } from "socket.io-client";
import { sleep } from "./sleep";
import { isOnBrowser } from "./const";
let ext = {} as any;
if (typeof window == "undefined") {
  ext = { ...global.ext };
} else {
  ext = { ...window.ext };
}

globalThis.ext2 = ext;

let websocket = undefined;
let URL_PRE;

export function getURL_PRE() {
  return URL_PRE;
}

if (process.env.runtime !== "node") {
  // web环境
  URL_PRE = location.origin + location.pathname.replace("index.html", "");

  if (ext.invert && process.env.myEnv != "prod") {
    let config = await ext.invert("getConfig", []);
    URL_PRE =
      "http://localhost:" + config.data.port + "/" + config.data.password + "/";
  }
  ext.invert = async (command: string, args: any, options: any = {}) => {
    const { signal } = options;
    let res = await fetch(URL_PRE + "api/" + command, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: signal,
    }).then((res) => res.json());
    return res;
  };
  let callbacks: { [key: string]: Array<(data: any) => void> } = {};
  ext.receive = (channel: string, listener: (data: any) => void) => {
    if (callbacks[channel]) {
      callbacks[channel].push(listener);
    } else {
      callbacks[channel] = [listener];
    }
  };

  const socket = io(URL_PRE + "main-message");
  socket.on("connect", () => {
    console.log("connected");
    websocket = socket;
  });
  socket.on("message-from-main", (data: any) => {
    if (process.env.myEnv == "dev") {
      console.log("Received message:", data);
    }
    if (callbacks["message-from-main"]) {
      for (let callback of callbacks["message-from-main"]) {
        callback(data);
      }
    }
  });
}
globalThis.ext2.call = call;
export async function call<k extends keyof Command>(
  command: k,
  args: Parameters<Command[k]> = [] as any,
  options: { signal?: AbortSignal } = {},
): Promise<ReturnType<Command[k]>> {
  try {
    // console.log(`command ${command}`, args);
    if (isOnBrowser) {
      const { replaceCommand } = await import("./callReplaceCommand");
      if (replaceCommand[command]) {
        return await replaceCommand[command].apply(null, args);
      }
    }
    let res = await ext.invert(command, args, options);
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

export async function msg_receive(
  channel: string,
  listener: (data: any) => void,
) {
  ext.receive(channel, listener);
}

export async function getWebSocket() {
  while (websocket == null) {
    await sleep(500);
  }
  return websocket;
}

export { ext };