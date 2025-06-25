import { zx } from "../es6.mjs";
const { $, usePowerShell, os } = zx;
$.verbose = true;
if (os.platform() === "win32") {
  usePowerShell();
}

console.log("process.env.use_electron", process.env.use_electron);
// Only load no_electron polyfills in core
await import("./no_electron.mjs").catch((err) =>
  console.error("Failed to load no_electron polyfill", err)
);

export * from "./polyfills.mjs";
