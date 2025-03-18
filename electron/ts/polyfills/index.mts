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
