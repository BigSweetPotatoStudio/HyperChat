import type { FileStat, WebDAVClient } from "webdav";

const { createClient } = await import(/* webpackIgnore: true */ "webdav");
import { promises as fs } from "fs";
import path from "path";
import { AppSetting } from "./data.mjs";
import { appDataDir } from "../const.mjs";
import { getMessageService } from "../mianWindow.mjs";
import { sleep } from "zx";
import Logger from "electron-log";
import { log } from "console";

interface FileInfo {
  path: string;
  modifiedTime: Date;
}

class WebDAVSync {
  private client: WebDAVClient;
  private webdavSetting = AppSetting["webdav"];
  init() {
    let setting = AppSetting.initSync();
    this.webdavSetting = setting.webdav;
    this.client = createClient(setting.webdav.url, {
      username: setting.webdav.username,
      password: setting.webdav.password,
    });
  }

  constructor() {}

  private async getLocalFileInfo(localPath: string): Promise<FileInfo[]> {
    const files = await fs.readdir(localPath);
    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const fullPath = path.join(localPath, file);
      const stats = await fs.stat(fullPath);
      fileInfos.push({
        path: file,
        modifiedTime: stats.mtime,
      });
    }
    return fileInfos;
  }

  private async getRemoteFileInfo(remotePath: string): Promise<FileInfo[]> {
    const contents: any = await this.client
      .getDirectoryContents(remotePath)
      .catch(async (e) => {
        if (e.status === 404) {
          await this.client.createDirectory(remotePath);
          return [];
        }
      });
    return contents.map((item) => ({
      path: item.basename,
      modifiedTime: new Date(item.lastmod),
    }));
  }
  async sync(
    localPath: string = appDataDir,
    remotePath: string = this.webdavSetting.baseDirName
  ): Promise<void> {
    if (this.status === 0 || this.status === -1) {
      this.status = 1;
      Logger.log("Syncing, start");
    } else if (this.status === 1) {
      this.status = 2;
      while (1) {
        Logger.log("Syncing, waiting");
        await sleep(1000);
        if (this.status === 0) {
          return await this._sync(localPath, remotePath);
        }
      }
      return;
    } else {
      Logger.log("Syncing, skip");
      return;
    }
    try {
      let res = await this._sync(localPath, remotePath);
      this.status = 0;
      return res;
    } catch (e) {
      this.status = -1;
      throw e;
    }
  }
  status: number = 0;
  private async _sync(localPath: string, remotePath: string): Promise<void> {
    try {
      getMessageService().sendToRenderer({
        type: "sync",
        data: {
          status: 1,
        },
      });

      const localFiles = await this.getLocalFileInfo(localPath);
      const remoteFiles = await this.getRemoteFileInfo(remotePath);
      Logger.log("Syncing, localFiles", localFiles);
      for (const localFile of localFiles) {
        // 跳过目录
        const fullPath = path.join(localPath, localFile.path);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) continue;

        const remoteFile = remoteFiles.find((r) => r.path === localFile.path);
        if (!remoteFile || localFile.modifiedTime > remoteFile.modifiedTime) {
          const content = await fs.readFile(
            path.join(localPath, localFile.path)
          );
          await this.client.putFileContents(
            path.join(remotePath, localFile.path).replace(/\\/g, "/"),
            content
          );
        }
      }
      Logger.log("Syncing, localFiles", remoteFiles);
      for (const remoteFile of remoteFiles) {
        const localFile = localFiles.find((l) => l.path === remoteFile.path);
        if (!localFile || remoteFile.modifiedTime > localFile.modifiedTime) {
          const content = await this.client.getFileContents(
            path.join(remotePath, remoteFile.path).replace(/\\/g, "/")
          );
          await fs.writeFile(
            path.join(localPath, remoteFile.path),
            content as any
          );
        }
      }
      getMessageService().sendToRenderer({
        type: "sync",
        data: {
          status: 0,
        },
      });
    } catch (error) {
      getMessageService().sendToRenderer({
        type: "sync",
        data: {
          status: -1,
        },
      });
      throw new Error(`Sync failed: ${error.message}`);
    }
  }
}

export const webdavClient = new WebDAVSync();
webdavClient.init();
