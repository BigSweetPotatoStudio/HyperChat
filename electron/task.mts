import { $, within, argv, sleep, fs, fetch, usePowerShell, os, path } from "zx";
import { pipeline } from "stream";
import { promisify } from "util";

import { createClient } from "webdav";
import packageJSON from "./package.json";
import AdmZip from "adm-zip";

$.verbose = true;
if (os.platform() == "win32") {
  usePowerShell();
}

if (argv.dev) {
  await $`npx cross-env NODE_ENV=development myEnv=dev webpack`;
  await $`npm run start`;
}
if (argv.watch) {
  await $`npx cross-env NODE_ENV=development myEnv=dev webpack`;
}

if (argv.devnode) {
  let rootPackageJSON = await fs.readJSON("../package.json");
  let packageJSON = await fs.readJSON("./package.json");
  packageJSON.version = rootPackageJSON.version;
  // console.log(packageJSON.dependencies);
  fs.writeJSON("./package.json", packageJSON, {
    spaces: 2,
  });
  await $`npx cross-env NODE_ENV=development myEnv=dev webpack -c webpack.no_electron.js`;
  await $`node js/main_no_electron.js`;
}

if (argv.testprod) {
  await $`npx cross-env NODE_ENV=production myEnv=test webpack`;
  await $`npx cross-env NODE_ENV=production myEnv=test electron-builder`;
}

if (argv.prod) {
  await fs.copy("../web/public/logo.png", "./web-build/assets/favicon.png", {
    overwrite: true,
  });
  await $`npx cross-env NODE_ENV=production myEnv=prod webpack`;
  if (process.env.MYRUNENV === "github" || process.env.GH_TOKEN) {
    if (os.platform() == "darwin" && os.arch() === 'x64') {
      console.log('Building for x86/x64 architecture');
      let pack = await fs.readJSON("./package.json");
      pack.build.afterAllArtifactBuild = "./build/remove-x64-latest-mac-yml.js";
      pack.build.mac.target = [{
        "arch": [
          "x64"
        ],
        "target": "dmg"
      },
      {
        "arch": [
          "x64"
        ],
        "target": "zip"
      }];
      await fs.writeJSON("./package.json", pack, { spaces: 2 });
      await $`npx cross-env NODE_ENV=production myEnv=prod electron-builder --publish always`;
    } else {
      await $`npx cross-env NODE_ENV=production myEnv=prod electron-builder --publish always`;
    }
  } else {
    await $`npx cross-env NODE_ENV=production myEnv=prod electron-builder --publish never`;
  }
}

if (argv.build) {
  await fs.copy("../web/public/logo.png", "./web-build/assets/favicon.png", {
    overwrite: true,
  });
  await $`npx cross-env NODE_ENV=production myEnv=prod webpack`;
  await $`npx cross-env NODE_ENV=production myEnv=prod electron-builder --publish never`;
}

if (argv.buildnode) {
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

// 压缩文件夹
function zipFolder(folderPath, outputPath) {
  const zip = new AdmZip();
  zip.addLocalFolder(folderPath);
  zip.writeZip(outputPath);
}

// 提取压缩文件
function extractZip(zipPath, outputPath) {
  var unzip = new AdmZip(zipPath);
  unzip.extractAllTo(outputPath, /*overwrite*/ true);
}
