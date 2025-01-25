import { $, argv, fs, os, path, usePowerShell, within } from "zx";
import { fileURLToPath } from "url";

import spawn from "cross-spawn";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pack = await fs.readJSON(path.resolve(__dirname, "./package.json"));

let webpackage = await fs.readJSON(
  path.resolve(__dirname, "./web/package.json")
);
if (webpackage.version != pack.version) {
  webpackage.version = pack.version;
  await fs.writeFile(
    path.resolve(__dirname, "./web/package.json"),
    JSON.stringify(webpackage, null, 2)
  );
}
let electronpackage = await fs.readJSON(
  path.resolve(__dirname, "./electron/package.json")
);
if (electronpackage.version != pack.version) {
  electronpackage.version = pack.version;
  await fs.writeFile(
    path.resolve(__dirname, "./electron/package.json"),
    JSON.stringify(electronpackage, null, 2)
  );
}

$.verbose = true;

if (os.platform() === "win32") {
  usePowerShell();
}

fs.writeFileSync(
  "./electron/node_modules/@modelcontextprotocol/sdk/dist/client/stdio.js",
  fs
    .readFileSync(
      "./electron/node_modules/@modelcontextprotocol/sdk/dist/client/stdio.js"
    )
    .toString()
    .replace(
      `import { spawn } from "node:child_process";`,
      `import  spawn  from "cross-spawn";`
    )
);

if (
  !fs
    .readFileSync(
      "./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js"
    )
    .toString()
    .includes(`'eventsource'`)
) {
  fs.writeFileSync(
    "./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js",
    fs
      .readFileSync(
        "./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js"
      )
      .toString()
      .replace(
        `import { JSONRPCMessageSchema } from "../types.js";`,
        `import { JSONRPCMessageSchema } from "../types.js";
import {EventSource} from 'eventsource'`
      )
  );
}

const spawnWithOutput = (command: string, args: string[], options) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, options);
    let stdout = "";
    let stderr = "";

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      // console.log(data.toString()); // 实时输出
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      // console.error(data.toString()); // 实时输出错误
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      } else {
        resolve({
          stdout,
          stderr,
          code,
        });
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
};

if (argv.dev) {
  spawnWithOutput(
    "npx",
    ["cross-env", "NODE_ENV=development", "myEnv=dev", "webpack", "serve"],
    {
      cwd: path.resolve(__dirname, "./web/"),
    }
  );
  spawnWithOutput(
    "npx",
    [
      "cross-env",
      "NODE_ENV=development",
      "myEnv=dev",
      "webpack",
      "-w",
      "-c",
      "webpack.eval.js",
    ],
    {
      cwd: path.resolve(__dirname, "./web/"),
    }
  );

  spawnWithOutput("npm", ["run", "dev"], {
    cwd: path.resolve(__dirname, "./electron/"),
  });

  // $({
  //   cwd: path.resolve(__dirname, "./web/"),
  //   spawn: spawn as any,
  // })`npx cross-env NODE_ENV=development webpack serve -c webpack.config.js`;

  // $({
  //   cwd: path.resolve(__dirname, "./electron/"),
  //   spawn: spawn as any,
  // })`npm run dev`;
}

if (argv.prod) {
  await $({
    cwd: path.resolve(__dirname, "./web/"),
  })`npx cross-env NODE_ENV=production myEnv=prod webpack -c webpack.config.js`;
  await fs.copy(
    `./web/public/logo.png`,
    `./electron/web-build/assets/favicon.png`,
    {
      overwrite: true,
    }
  );

  await $({
    cwd: path.resolve(__dirname, "./electron/"),
  })`npm run prod`;

  let p = path.resolve(__dirname, `./dist`);
  fs.ensureDirSync(p);
  let pack = await fs.readJSON(
    path.resolve(__dirname, "./electron/package.json")
  );

  let arr = [
    `HyperChat-${pack.version}-win-x64.exe`,
    `HyperChat-${pack.version}-mac-x64.exe`,
    `HyperChat-${pack.version}-mac-arm64.exe`,
  ];
  for (let name of arr) {
    if (fs.existsSync(`./electron/dist/HyperChat-${pack.version}-x64.exe`)) {
      await fs.copy(`./electron/dist/` + name, p + `/` + name, {
        overwrite: true,
      });
    }
  }
}

if (argv.test) {
  await within(() => {
    return Promise.all([
      $({
        cwd: path.resolve(__dirname, "./web/"),
      })`npx cross-env NODE_ENV=development myEnv=test webpack -c webpack.config.js`,
      $({
        cwd: path.resolve(__dirname, "./electron/"),
      })`npm run testprod`,
    ]);
  });
}
