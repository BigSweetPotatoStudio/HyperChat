import { $, within, argv, sleep, fs, fetch, usePowerShell, os, path } from "zx";
import { pipeline } from "stream";
import { promisify } from "util";

import { createClient } from "webdav";
import packageJSON from "./package.json" with { type: "json" };
import AdmZip from "adm-zip";

$.verbose = true;
if (os.platform() == "win32") {
  usePowerShell();
}


if (argv.watch) {
  await $`npx cross-env NODE_ENV=development myEnv=dev webpack`;
}

if (argv.dev) {
  await $`npx cross-env NODE_ENV=production myEnv=dev tsx --inspect=19999 src/main.mts`;
}

