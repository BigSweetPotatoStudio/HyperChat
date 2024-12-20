import type { CommandFactory as Command } from "../../../electron/ts/command.mts";

export async function call<k extends keyof Command>(
  command: k,
  args: Parameters<Command[k]> = [] as any,
): Promise<ReturnType<Command[k]>> {
  try {
    // console.log(`command ${command}`, args);
    let res;
    if (window.ext) {
      res = await window.ext.invert(command, args);
    } else {
      res = await fetch("/api/" + command, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      }).then((res) => res.json());
    }
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}
// 在渲染进程中监听消息
window.ext.receive("message-from-main", (data: any) => {
  console.log("Received message:", data);
});
