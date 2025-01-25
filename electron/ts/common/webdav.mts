import type { FileStat, WebDAVClient } from "webdav";

const { createClient } = await import(/* webpackIgnore: true */ "webdav");
import { promises } from "fs";
import path, { join } from "path";
import { AppSetting } from "./data.mjs";
import { appDataDir } from "../const.mjs";
import { getMessageService } from "../mianWindow.mjs";
import { sleep } from "zx";
import Logger from "electron-log";
import { log } from "console";
import { DataList } from "../../../common/data";
import { fs } from "zx";
import crypto from "crypto";

interface FileInfo {
  filepath: string;
  modifiedTime: Date;
  filename: string;
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
    if (setting.webdav.autoSync) {
      setTimeout(() => {
        Logger.info("autoSync 5min");
        this.sync();
      }, 1000 * 5 * 60);
    }
  }

  constructor() {}

  private async getLocalFilesInfo(
    localPath: string,
    p = ""
  ): Promise<FileInfo[]> {
    const files = await fs.readdir(localPath);
    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const fullPath = path.join(localPath, file);
      const stats = await fs.stat(fullPath);
      fileInfos.push({
        filename: file,
        filepath: (p ? p + "/" : "") + file,
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
    // console.log(contents);
    return contents.map((item) => ({
      filename: item.basename,
      filepath: item.filename,
      modifiedTime: new Date(item.lastmod),
    }));
  }
  _isSnyc = false;
  sync = async () => {
    if (this._isSnyc) {
      return;
    }
    this._isSnyc = true;
    console.log("---syncStart");
    let localPath: string = appDataDir;
    let remotePath: string = this.webdavSetting.baseDirName;
    getMessageService().sendToRenderer({
      type: "sync",
      data: {
        status: 1,
      },
    });

    try {
      await this._sync(localPath, remotePath);

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
    } finally {
      this._isSnyc = false;
      console.log("---syncEnd");
    }
  };
  // async _syncFile(
  //   fileName: string,
  //   localPath: string = appDataDir,
  //   remotePath: string = this.webdavSetting.baseDirName
  // ) {
  //   const content = await fs.readFile(path.join(localPath, fileName));
  //   console.log(
  //     "upload file",
  //     path.join(remotePath, fileName).replace(/\\/g, "/")
  //   );
  //   await this.client.putFileContents(
  //     path.join(remotePath, fileName).replace(/\\/g, "/"),
  //     content
  //   );
  //   getMessageService().sendToRenderer({
  //     type: "sync",
  //     data: {
  //       status: 0,
  //     },
  //   });
  // }
  status: number = 0;
  private async _sync(localPath: string, remotePath: string): Promise<void> {
    const localFiles = await this.getLocalFilesInfo(localPath);
    let remoteFiles = await this.getRemoteFilesInfo(remotePath);

    const localSyncPath = path.join(localPath, "_sync");
    await fs.ensureDir(localSyncPath);

    const localBackupPath = path.join(localPath, "_backup"); // 备份文件夹
    await fs.ensureDir(localBackupPath);

    let localSyncFiles = await this.getLocalFilesInfo(localSyncPath, "_sync");
    // console.log("sync", localPath, remotePath, localSyncPath, localBackupPath);
    // 生成hash
    for (let data of DataList) {
      let filename = data.KEY;
      let json = data.initSync();
      if (data.options.sync) {
        // console.log("sync data", path.join(localPath + "/_sync", data.KEY));
        let fullPath = path.join(localPath, filename);
        if (!fs.existsSync(fullPath)) {
          continue;
        }
        let content = JSON.stringify(json);
        let md5 = crypto.createHash("md5").update(content).digest("hex");
        let p = path.parse(filename);
        // console.log(p);
        let hashFileName = p.name + "___" + md5 + p.ext;
        let localSyncFilePATH = path.join(localSyncPath, hashFileName);
        let localSyncFile = localSyncFiles.find((x) =>
          x.filename.startsWith(p.name)
        );
        // 生成hash文件
        if (localSyncFile?.filename == hashFileName) {
        } else {
          if (localSyncFile) {
            fs.moveSync(
              path.join(localSyncPath, localSyncFile.filename),
              path.join(localBackupPath, localSyncFile.filename),
              {
                overwrite: true,
              }
            );
          }
          fs.writeFileSync(localSyncFilePATH, content);
        }
      }
    }

    localSyncFiles = await this.getLocalFilesInfo(localSyncPath, "_sync");

    try {
      for (let data of DataList) {
        let filename = data.KEY;
        let json = await data.init();
        if (data.options.sync) {
          // console.log("sync data", path.join(localPath + "/_sync", data.KEY));
          let p = path.parse(filename);
          // 查找远程对应的文件
          let remoteFile = remoteFiles.find((x) =>
            x.filename.startsWith(p.name)
          );

          let localFile = localFiles.find((l) => l.filename === filename);
          let localSyncFile = localSyncFiles.find((x) =>
            x.filename.startsWith(p.name)
          );

          if (
            !remoteFile ||
            localFile?.modifiedTime > remoteFile.modifiedTime
          ) {
            // 对比hash，远程和本地
            if (!(remoteFile?.filename === localSyncFile.filename)) {
              console.log(
                "upload file",
                remotePath + "/" + localSyncFile.filename
              );
              let content = await fs.readFile(
                path.join(localSyncPath, localSyncFile.filename)
              );
              await this.client.putFileContents(
                remotePath + "/" + localSyncFile.filename,
                content
              );
              // console.log("safdafasdf", remoteFiles, p.name);
              try {
                let rf = remoteFiles.find((r) => r.filename.startsWith(p.name));
                if (rf) {
                  await this.client.deleteFile(rf.filepath);
                } else {
                  console.log("deleteed not found", p.name);
                }
              } catch (e) {
                console.log("delete error: ", e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.trace("upload error: ", e);
      throw e;
    }
    localSyncFiles = await this.getLocalFilesInfo(localSyncPath, "_sync");
    remoteFiles = await this.getRemoteFilesInfo(remotePath);
    try {
      for (const remoteFile of remoteFiles) {
        if (!remoteFile.filename.includes("___")) {
          continue;
        }

        let ext = path.extname(remoteFile.filename);
        let [name, md5] = remoteFile.filename.split("___");

        const localFile = localFiles.find((l) => l.filename === name + ext);
        // 本地文件不存在，或者已删除
        if (!localFile || remoteFile.modifiedTime > localFile.modifiedTime) {
          // if (!localFile) {
          //   Logger.info("localFile 不存在");
          // }
          // if (remoteFile.modifiedTime > localFile.modifiedTime) {
          //   Logger.info("remoteFile 时间更加新");
          // }
          // 查找本地文件hash
          const localSyncFile = localSyncFiles.find((x) =>
            x.filename.startsWith(name)
          );

          if (localSyncFile?.filename === remoteFile.filename) {
            if (!fs.existsSync(path.join(localPath, name + ext))) {
              console.log("restore file", remoteFile.filepath);
              const content = await fs.readFile(
                path.join(localSyncPath, remoteFile.filename)
              );
              await fs.writeFile(
                path.join(localPath, name + ext),
                JSON.stringify(JSON.parse(content.toString()), null, 4)
              );
            }
          } else {
            // if (localSyncFile?.filename !== remoteFile.filename) {
            //   Logger.info(
            //     "localSyncFile 不存在",
            //     localSyncFile.filename,
            //     remoteFile.filename
            //   );
            // }
            console.log("download file", remoteFile.filepath);
            // 把上一个hash文件备份
            if (localSyncFile) {
              await fs.move(
                path.join(localSyncPath, localSyncFile.filename),
                path.join(localBackupPath, localSyncFile.filename),
                { overwrite: true }
              );
            }
            let content = await this.client.getFileContents(
              remoteFile.filepath
            );
            content = content.toString();
            await fs.writeFile(
              path.join(localSyncPath, remoteFile.filename),
              content
            );
            await fs.writeFile(
              path.join(localPath, name + ext),
              JSON.stringify(JSON.parse(content.toString()), null, 4)
            );
          }
        }
      }
    } catch (e) {
      console.trace("download error: ", e);
      throw e;
    }

    try {
      let localBackupFiles = await this.getLocalFilesInfo(
        localBackupPath,
        "_backup"
      );
      // 从大到小
      localBackupFiles = localBackupFiles.sort(
        (a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime()
      );
      for (let data of DataList) {
        let filename = data.KEY;
        if (data.options.sync) {
          // console.log("sync data", path.join(localPath + "/_sync", data.KEY));
          let fullPath = path.join(localPath, filename);
          if (!fs.existsSync(fullPath)) {
            continue;
          }
          let p = path.parse(filename);
          let curr = localBackupFiles.filter((x) =>
            x.filename.startsWith(p.name)
          );
          if (curr.length <= 10) {
            continue;
          }
          let delArr = curr.splice(10);
          for (let x of delArr) {
            fs.rmSync(path.join(localBackupPath, x.filename));
          }
        }
      }
    } catch (e) {}
  }
}

function minDate(a?: Date, b?: Date) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a.getTime() < b.getTime() ? a : b;
}

export const webdavClient = new WebDAVSync();
webdavClient.init();

// function otherDebounce<T>(callback: (...args) => Promise<void>) {
//   let map = {};
//   return async function (...args) {
//     let key = JSON.stringify(args);
//     if (map[key] == null) {
//       map[key] = 0;
//     }

//     if (map[key] === 0 || map[key] === -1) {
//       map[key] = 1;
//       Logger.log("Syncing, start");
//     } else if (map[key] === 1) {
//       map[key] = 2;
//       while (1) {
//         Logger.log("Syncing, waiting");
//         await sleep(1000);
//         if (map[key] === 0) {
//           await callback(...args);
//         }
//       }
//       return;
//     } else {
//       Logger.log("Syncing, skip");
//       return;
//     }
//     try {
//       await callback(...args);
//       map[key] = 0;
//     } catch (e) {
//       map[key] = -1;
//       throw e;
//     }
//   };
// }
function debounce(func, delay) {
  let timeoutId;
  let status: number = 0;
  return async function c(...args) {
    console.log("debounce", status);
    const context = this;
    if (status == 0) {
      console.log("定时器还未运行，直接取消");
      // 清除之前的定时器
      clearTimeout(timeoutId);
      timeoutId = null;
    } else if (status == 1) {
      console.log("定时器已经运行，函数还没有完成，等待");
      while (true) {
        if (status == 1) {
          await sleep(300);
        } else if (status == 2) {
          status = 0;
          break;
        }
      }

      c.apply(context, args);
    } else if (status == 2) {
      console.log("函数已经完成", timeoutId);
      status = 0;
    }
    // 设置新的定时器
    timeoutId = setTimeout(async () => {
      status = 1;
      await func.apply(context, args);
      status = 2;
    }, delay);
  };
}

// function asyncDebounce(func, delay) {
//   let timeoutId = null;
//   let currentPromise = null;

//   return function (...args) {
//     const context = this;

//     // 清除上一个定时器
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }

//     // 创建新的 Promise
//     const newPromise = new Promise(async (resolve, reject) => {
//       // 如果有正在执行的 Promise，等待其完成
//       if (currentPromise) {
//         try {
//           await currentPromise;
//         } catch {}
//       }

//       // 设置新的定时器
//       timeoutId = setTimeout(async () => {
//         try {
//           const result = await func.apply(context, args);
//           resolve(result);
//         } catch (error) {
//           reject(error);
//         } finally {
//           timeoutId = null;
//           currentPromise = null;
//         }
//       }, delay);
//     });

//     // 保存当前 Promise
//     currentPromise = newPromise;

//     return newPromise;
//   };
// }
