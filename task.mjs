var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { $, argv, fs, os, path, usePowerShell, within } from "zx";
import { fileURLToPath } from "url";
import spawn from "cross-spawn";
$.verbose = true;
if (os.platform() === "win32") {
    usePowerShell();
}
fs.writeFileSync("./electron/node_modules/@modelcontextprotocol/sdk/dist/client/stdio.js", fs
    .readFileSync("./electron/node_modules/@modelcontextprotocol/sdk/dist/client/stdio.js")
    .toString()
    .replace("import { spawn } from \"node:child_process\";", "import  spawn  from \"cross-spawn\";"));
if (!fs
    .readFileSync("./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js")
    .toString()
    .includes("'eventsource'")) {
    fs.writeFileSync("./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js", fs
        .readFileSync("./electron/node_modules/@modelcontextprotocol/sdk/dist/client/sse.js")
        .toString()
        .replace("import { JSONRPCMessageSchema } from \"../types.js\";", "import { JSONRPCMessageSchema } from \"../types.js\";\nimport {EventSource} from 'eventsource'"));
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var spawnWithOutput = function (command, args, options) {
    return new Promise(function (resolve, reject) {
        var proc = spawn(command, args, options);
        var stdout = "";
        var stderr = "";
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.stdout.on("data", function (data) {
            stdout += data.toString();
            // console.log(data.toString()); // 实时输出
        });
        proc.stderr.on("data", function (data) {
            stderr += data.toString();
            // console.error(data.toString()); // 实时输出错误
        });
        proc.on("close", function (code) {
            if (code !== 0) {
                reject(new Error("Command failed with code ".concat(code, "\n").concat(stderr)));
            }
            else {
                resolve({
                    stdout: stdout,
                    stderr: stderr,
                    code: code,
                });
            }
        });
        proc.on("error", function (err) {
            reject(err);
        });
    });
};
if (argv.dev) {
    spawnWithOutput("npx", ["cross-env", "NODE_ENV=development", "myEnv=dev", "webpack", "serve"], {
        cwd: path.resolve(__dirname, "./web/"),
    });
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
    await within(function () {
        return Promise.all([
            $({
                cwd: path.resolve(__dirname, "./web/"),
            })(templateObject_1 || (templateObject_1 = __makeTemplateObject(["npx cross-env NODE_ENV=production myEnv=prod webpack -c webpack.config.js"], ["npx cross-env NODE_ENV=production myEnv=prod webpack -c webpack.config.js"]))),
            $({
                cwd: path.resolve(__dirname, "./electron/"),
            })(templateObject_2 || (templateObject_2 = __makeTemplateObject(["npm run prod"], ["npm run prod"]))),
        ]);
    });
    var p = path.resolve(__dirname, "./dist");
    fs.ensureDirSync(p);
    var pack = await fs.readJSON(path.resolve(__dirname, "./electron/package.json"));
    if (os.platform() === "win32") {
        await fs.copy("./electron/dist/HyperChat Setup ".concat(pack.version, ".exe"), p + "/HyperChat-Setup-".concat(pack.version, ".exe"), {
            overwrite: true,
        });
    }
    else {
        await fs.copy("./electron/dist/HyperChat Setup ".concat(pack.version, ".exe"), p + "/HyperChat-Setup-".concat(pack.version, ".exe"), {
            overwrite: true,
        });
        await fs.copy("./electron/dist/HyperChat-".concat(pack.version, "-arm64.dmg"), p + "/HyperChat-".concat(pack.version, "-arm64.dmg"), {
            overwrite: true,
        });
        await fs.copy("./electron/dist/HyperChat-".concat(pack.version, ".dmg"), p + "/HyperChat-".concat(pack.version, "-x64.dmg"), {
            overwrite: true,
        });
    }
}
if (argv.test) {
    await within(function () {
        return Promise.all([
            $({
                cwd: path.resolve(__dirname, "./web/"),
            })(templateObject_3 || (templateObject_3 = __makeTemplateObject(["npx cross-env NODE_ENV=development myEnv=test webpack -c webpack.config.js"], ["npx cross-env NODE_ENV=development myEnv=test webpack -c webpack.config.js"]))),
            $({
                cwd: path.resolve(__dirname, "./electron/"),
            })(templateObject_4 || (templateObject_4 = __makeTemplateObject(["npm run testprod"], ["npm run testprod"]))),
        ]);
    });
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
