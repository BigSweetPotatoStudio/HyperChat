// import path from "path";
// import os from "os";
// import { zx } from "ts/es6.mjs";
// const { fs } = zx;
// export const dirName = "HyperChat";
// export const appDataDir = path.join(os.homedir(), "Documents", dirName);
// fs.ensureDirSync(appDataDir);

// export const CONST = {
//   userDataPath: "",
//   appDataDir: appDataDir,
//   dirName: dirName,
// };


if (process.env.no_electron) {
  await import("./no_electron.mjs").catch((err) =>
    console.error("Failed to load no_electron polyfill", err)
  );
} else {
  await import("./electron.mjs").catch((err) =>
    console.error("Failed to load electron polyfill", err)
  );
}


export * from './polyfills.mjs'