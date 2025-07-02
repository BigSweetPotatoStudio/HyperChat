const { contextBridge, ipcRenderer } = require("electron/renderer");

console.log("preload");

// contextBridge.exposeInMainWorld("ext", {
//   invert: (name: string, args: any[] = []) => {
//     return ipcRenderer.invoke("command", name, args);
//   },
//   // receive: (channel: string, func: Function) => {
//   //   ipcRenderer.on(channel, (event, ...args) => func(...args));
//   // },
// });

// contextBridge.exposeInMainWorld("electron", {
//   platform: process.platform,
// });