await import("./no_electron.mjs");
if (process.env.no_electron != "1") {
  await import("./electron.mjs");
}
export * from "./lib.mjs";
