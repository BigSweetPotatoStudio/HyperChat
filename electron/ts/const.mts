import { app } from "electron";
import path from "path";
import os from "os";
const { fs } = zx;
import log from "electron-log";
import { zx } from "./es6.mjs";
export const userDataPath = app.getPath("userData");

export const dirName = "HyperChat";
export const appDataDir = path.join(os.homedir(), "Documents", dirName);
fs.ensureDirSync(appDataDir);
