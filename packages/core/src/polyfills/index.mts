import { zx } from "../es6.mjs";
const { $, usePowerShell, os } = zx;
$.verbose = true;
if (os.platform() === "win32") {
  usePowerShell();
}

console.log("process.env.use_electron", process.env.use_electron);
// Only load no_electron polyfills in core


export * from "./polyfills.mjs";
