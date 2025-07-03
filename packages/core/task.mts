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


if (argv.build) {
  await fs.copy("../web/public/logo.png", "./web-build/assets/favicon.png", {
    overwrite: true,
  });
  let rootPackageJSON = await fs.readJSON("../package.json");
  let packageJSON = await fs.readJSON("./package.json");
  let nodePackageJSON = await fs.readJSON("./package.nodejs.json");
  Object.assign(packageJSON, nodePackageJSON);
  packageJSON.version = rootPackageJSON.version;
  // console.log(packageJSON.dependencies);
  if (packageJSON.dependencies) {
    for (let key in packageJSON.dependencies) {
      if (key.startsWith("electron")) {
        delete packageJSON.dependencies[key];
      }
    }
  }
  await fs.writeJSON("./package.json", packageJSON, { spaces: 2 });
  await fs.copy("../README.md", "README.md");
  await $`npx cross-env NODE_ENV=development myEnv=dev webpack -c webpack.no_electron.js`;
}

