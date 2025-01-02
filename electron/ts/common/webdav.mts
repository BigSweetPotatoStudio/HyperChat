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
import { DataList } from "../../../common/data";

interface FileInfo {
  path: string;
  modifiedTime: Date;
}

class WebDAVSync {
  private client: WebDAVClient;
  public webdavSetting = AppSetting["webdav"];
  init() {
    let setting = AppSetting.initSync();
    this.webdavSetting = setting.webdav;
    this.client = createClient(setting.webdav.url, {
      username: setting.webdav.username,
      password: setting.webdav.password,
    });
  }

  constructor() {}

  private async getLocalFilesInfo(localPath: string): Promise<FileInfo[]> {
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

  private async getRemoteFilesInfo(remotePath: string): Promise<FileInfo[]> {
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
  sync = otherDebounce(async (fileName?: string) => {
    let localPath: string = appDataDir;
    let remotePath: string = this.webdavSetting.baseDirName;
    getMessageService().sendToRenderer({
      type: "sync",
      data: {
        status: 1,
      },
    });
    console.log("sync", fileName);
    try {
      if (fileName) {
        await this._syncFile(fileName, localPath, remotePath);
      } else {
        await this._sync(localPath, remotePath);
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
  });
  async _syncFile(
    fileName: string,
    localPath: string = appDataDir,
    remotePath: string = this.webdavSetting.baseDirName
  ) {
    const content = await fs.readFile(path.join(localPath, fileName));
    console.log(
      "upload file",
      path.join(remotePath, fileName).replace(/\\/g, "/")
    );
    await this.client.putFileContents(
      path.join(remotePath, fileName).replace(/\\/g, "/"),
      content
    );
    getMessageService().sendToRenderer({
      type: "sync",
      data: {
        status: 0,
      },
    });
  }
  status: number = 0;
  private async _sync(localPath: string, remotePath: string): Promise<void> {
    const localFiles = await this.getLocalFilesInfo(localPath);
    const remoteFiles = await this.getRemoteFilesInfo(remotePath);
    // Logger.log("Syncing, localFiles", localFiles);
    for (const localFile of localFiles) {
      // 跳过目录
      const fullPath = path.join(localPath, localFile.path);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) continue;
      if (
        DataList.filter((item) => item.options.sync)
          .map((x) => x.KEY)
          .includes(localFile.path)
      ) {
        const remoteFile = remoteFiles.find((r) => r.path === localFile.path);
        if (!remoteFile || localFile.modifiedTime > remoteFile.modifiedTime) {
          console.log(
            "upload file",
            path.join(remotePath, localFile.path).replace(/\\/g, "/")
          );
          const content = await fs.readFile(
            path.join(localPath, localFile.path)
          );
          await this.client.putFileContents(
            path.join(remotePath, localFile.path).replace(/\\/g, "/"),
            content
          );
        }
      } else {
        try {
          await this.client.deleteFile(
            path.join(remotePath, localFile.path).replace(/\\/g, "/")
          );
          console.log(
            "delete remotefile",
            path.join(remotePath, localFile.path).replace(/\\/g, "/")
          );
        } catch (e) {
          if (e.status === 404) {
          } else {
            throw e;
          }
        }
      }
    }
    // Logger.log("Syncing, localFiles", remoteFiles);
    for (const remoteFile of remoteFiles) {
      const localFile = localFiles.find((l) => l.path === remoteFile.path);
      if (!localFile || remoteFile.modifiedTime > localFile.modifiedTime) {
        console.log(
          "download file",
          path.join(remotePath, remoteFile.path).replace(/\\/g, "/")
        );
        const content = await this.client.getFileContents(
          path.join(remotePath, remoteFile.path).replace(/\\/g, "/")
        );
        await fs.writeFile(
          path.join(localPath, remoteFile.path),
          content as any
        );
      }
    }
  }
}

export const webdavClient = new WebDAVSync();
webdavClient.init();

function otherDebounce<T>(callback: (...args) => Promise<void>) {
  let map = {};
  return async function (...args) {
    let key = JSON.stringify(args);
    if (map[key] == null) {
      map[key] = 0;
    }

    if (map[key] === 0 || map[key] === -1) {
      map[key] = 1;
      Logger.log("Syncing, start");
    } else if (map[key] === 1) {
      map[key] = 2;
      while (1) {
        Logger.log("Syncing, waiting");
        await sleep(1000);
        if (map[key] === 0) {
          await callback(...args);
        }
      }
      return;
    } else {
      Logger.log("Syncing, skip");
      return;
    }
    try {
      await callback(...args);
      map[key] = 0;
    } catch (e) {
      map[key] = -1;
      throw e;
    }
  };
}
