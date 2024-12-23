import { $, argv, fs, os, path, usePowerShell, within } from "zx";
import { fileURLToPath } from "url";

import spawn from "cross-spawn";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  if (os.platform() === "win32") {
    await fs.copy(
      `./electron/dist/HyperChat Setup ${pack.version}.exe`,
      p + `/HyperChat-Setup-${pack.version}.exe`,
      {
        overwrite: true,
      }
    );
  } else {
    if (fs.existsSync(`./electron/dist/HyperChat Setup ${pack.version}.exe`)) {
      await fs.copy(
        `./electron/dist/HyperChat Setup ${pack.version}.exe`,
        p + `/HyperChat-Setup-${pack.version}.exe`,
        {
          overwrite: true,
        }
      );
    }
    await fs.copy(
      `./electron/dist/HyperChat-${pack.version}-arm64.dmg`,
      p + `/HyperChat-${pack.version}-arm64.dmg`,
      {
        overwrite: true,
      }
    );
    await fs.copy(
      `./electron/dist/HyperChat-${pack.version}.dmg`,
      p + `/HyperChat-${pack.version}-x64.dmg`,
      {
        overwrite: true,
      }
    );
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
