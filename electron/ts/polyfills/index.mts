import { zx } from "../es6.mjs";
const { $, usePowerShell, os } = zx;
$.verbose = true;
if (os.platform() === "win32") {
  usePowerShell();
}

console.log("process.env.no_electron", process.env.no_electron);
if (process.env.no_electron) {
  await import("./no_electron.mjs").catch((err) =>
    console.error("Failed to load no_electron polyfill", err)
  );
} else {
  await import("./electron.mjs").catch((err) =>
    console.error("Failed to load electron polyfill", err)
  );
}

export * from "./polyfills.mjs";
