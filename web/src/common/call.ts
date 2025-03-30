import type { CommandFactory as Command } from "../../../electron/ts/command.mts";
import { io } from "socket.io-client";
import { sleep } from "./sleep";
let ext = {} as any;
if (typeof window == "undefined") {
  ext = { ...global.ext };
} else {
  ext = { ...window.ext };
}

if (ext) {
  // 在渲染进程中监听消息
  // ext.receive("message-from-main", (data: any) => {
  //   console.log("Received message:", data);
  // });
} else {
  ext = {};
  window.ext = ext;
}

let websocket = undefined;
let URL_PRE;

export function getURL_PRE() {
  return URL_PRE;
}

if (process.env.runtime !== "node") {
  URL_PRE = location.origin + location.pathname;
  // web环境
  if (ext.invert && process.env.myEnv != "prod") {
    let res = await ext.invert("readFile", ["electronData.json"]);
    // console.log("=================", res);
    let electronData = JSON.parse(res.data || "{}");
    URL_PRE =
      "http://localhost:" +
      electronData.port +
      "/" +
      electronData.password +
      "/";
  }
  ext.invert = async (command: string, args: any) => {
    let res = await fetch(URL_PRE + "api/" + command, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
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
    console.log("Received message:", data);
    if (callbacks["message-from-main"]) {
      for (let callback of callbacks["message-from-main"]) {
        callback(data);
      }
    }
  });
}
export async function call<k extends keyof Command>(
  command: k,
  args: Parameters<Command[k]> = [] as any,
): Promise<ReturnType<Command[k]>> {
  try {
    // console.log(`command ${command}`, args);
    let res = await ext.invert(command, args);
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
