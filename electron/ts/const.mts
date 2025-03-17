import { app } from "electron";
import path from "path";
import os from "os";

import { zx } from "./es6.mjs";
const { fs } = zx;
export const userDataPath = app.getPath("userData");

export const dirName = "HyperChat";
export const appDataDir = path.join(os.homedir(), "Documents", dirName);
fs.ensureDirSync(appDataDir);
