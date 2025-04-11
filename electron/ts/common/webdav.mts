import type { FileStat, WebDAVClient } from "webdav";

import { promises } from "fs";
import path, { join } from "path";

import { appDataDir } from "ts/polyfills/index.mjs";
import { Logger } from "ts/polyfills/index.mjs";

import { AppSetting, ChatHistory, DataList, electronData } from "../../../common/data";

import crypto from "crypto";
import { createClient, zx } from "../es6.mjs";
import { getMessageService } from "../message_service.mjs";
import { Chat } from "openai/resources/index.mjs";
const { fs } = zx;

const isDev = false;

interface FileInfo {
  filepath: string;
  modifiedTime: Date;
  filename: string;
  hash?: string;
}

let timer = undefined;
class WebDAVSync {
  private client: WebDAVClient;
  public webdavSetting = AppSetting["webdav"];
  init() {
    let setting = AppSetting.initSync({ force: true });
    this.webdavSetting = setting.webdav;
    this.client = createClient(setting.webdav.url, {
      username: setting.webdav.username,
      password: setting.webdav.password,
    });

    timer = setInterval(() => {
      if (electronData.initSync().autoSync) {
        Logger.info("autoSync 5min");
        this.sync();
      }
    }, 1000 * 5 * 60);
  }

  constructor() { }

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
    return (contents || []).map((item) => ({
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
    getMessageService().sendAllToRenderer({
      type: "sync",
      data: {
        status: 1,
      },
    });

    try {
      await this._sync2(localPath, remotePath, DataList.filter(x => x.options.sync).map(x => x.KEY));
      await this._sync2(localPath + "/messages", remotePath + "/messages", fs.readdirSync(path.join(localPath, "messages")).filter(x => x.endsWith(".json")));
      getMessageService().sendAllToRenderer({
        type: "sync",
        data: {
          status: 0,
        },
      });
    } catch (error) {
      getMessageService().sendAllToRenderer({
        type: "sync",
        data: {
          status: -1,
        },
      });
      throw error;
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
      let json = data.initSync({ force: true });
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
        // let json =  data.initSync({ force: true });
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
            if (
              localSyncFile != null &&
              remoteFile?.filename != localSyncFile.filename
            ) {
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
              // if (data.KEY == ChatHistory.KEY) {
              //   let history = ChatHistory.initSync({ force: true });
              //   for (let item of history.data) {
              //     if (item.messages.length == 0 && fs.existsSync(path.join(appDataDir, "messages", item.key + ".json"))) {
              //       let content = fs.readFileSync(path.join(appDataDir, "messages", item.key + ".json"), "utf-8")
              //       let hash = crypto.createHash("md5").update(content.replace(/\r\n|\r|\n/g, '')).digest("hex");
              //       if (item.massagesHash != hash) {
              //         await this.client.putFileContents(
              //           remotePath + "/" + "messages/" + item.key + ".json",
              //           content
              //         );
              //         item.massagesHash = hash;
              //       }
              //     }
              //   }
              //   await ChatHistory.save();
              // }

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
            // 不用同步
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

            let obj = JSON.parse(content);
            await fs.writeFile(
              path.join(localPath, name + ext),
              JSON.stringify(obj, null, 4)
            );

            // if (name + ext == ChatHistory.KEY) {
            //   let history = ChatHistory.initSync({ force: true });
            //   for (let item of history.data) {
            //     if (item.messages.length == 0) {
            //       let content = await fs.readFile(path.join(appDataDir, "messages", item.key + ".json"), "utf-8").catch(e => "")
            //       let hash = crypto.createHash("md5").update(content.replace(/\r\n|\r|\n/g, '')).digest("hex");
            //       if (item.massagesHash != hash) {
            //         let content = await this.client.getFileContents(
            //           remotePath + "/" + "messages/" + item.key + ".json",
            //         );
            //         fs.writeFileSync(path.join(appDataDir, "messages", item.key + ".json"), content.toString(),);
            //       }
            //     }
            //   }
            //   await ChatHistory.save();
            // }

            getMessageService().sendAllToRenderer({
              type: "syncNodeToWeb",
              data: { key: name + ext, data: obj },
            });
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
    } catch (e) { }
  }
  private getLocalFilesInfo2(localPath: string, files: string[]) {
    const fileInfos: FileInfo[] = [];

    for (const filename of files) {
      const fullPath = path.join(localPath, filename);
      if (!fs.existsSync(fullPath)) {
        continue;
      }
      let fileParse = path.parse(filename);
      if (fileParse.ext == ".json") {
        const stats = fs.statSync(fullPath);
        let content = fs.readFileSync(fullPath, "utf-8");
        let hash = crypto.createHash("md5").update(content.replace(/\r\n|\r|\n/g, '')).digest("hex");
        fileInfos.push({
          filename: filename,
          filepath: fullPath,
          modifiedTime: stats.mtime,
          hash: hash,
        });
      } else {
        const stats = fs.statSync(fullPath);
        let content = fs.readFileSync(fullPath);
        let hash = crypto.createHash("md5").update(content).digest("hex");
        fileInfos.push({
          filename: filename,
          filepath: fullPath,
          modifiedTime: stats.mtime,
          hash: hash,
        });
      }
    }
    return fileInfos;
  }
  private async _sync2(localPath: string, remotePath: string, files: string[]) {

    let remoteFiles = await this.getRemoteFilesInfo(remotePath);
    let localFiles = this.getLocalFilesInfo2(localPath, files);
    // console.log("localFiles", localFiles);
    // console.log("remoteFiles", remoteFiles);

    for (let filename of files) {
      if (fs.existsSync(path.join(localPath, filename))) {
        let fileParse = path.parse(filename);

        let localFile = localFiles.find((l) => l.filename === filename);
        let remoteFileName = fileParse.name + "___" + localFile.hash + fileParse.ext;

        let remoteFile = remoteFiles.find((x) => x.filename.startsWith(fileParse.name));

        if (remoteFile) {
          let fileParse = path.parse(remoteFile.filename);
          let [name, hash] = fileParse.name.split("___");
          if (hash == localFile.hash) {
            isDev && Logger.info("skip upload file(hash match)", path.join(remotePath, remoteFileName));
          } else {
            if (localFile.modifiedTime > remoteFile.modifiedTime) {
              Logger.info("upload file(hash no match)", path.join(remotePath, remoteFileName));
              let content = fs.readFileSync(path.join(localPath, filename), "utf-8");
              await this.client.putFileContents(path.join(remotePath, remoteFileName), content);
              try {
                let rf = remoteFiles.find((r) => r.filename.startsWith(name));
                if (rf) {
                  await this.client.deleteFile(rf.filepath);
                }
              } catch (e) {
                console.log("delete error: ", e);
              }
            } else {
              isDev && Logger.info("skip upload file(time no match)", path.join(remotePath, remoteFileName));
            }
          }
        } else {
          Logger.info("upload file(not found)", path.join(remotePath, remoteFileName));
          let content = fs.readFileSync(path.join(localPath, filename), "utf-8");
          await this.client.putFileContents(path.join(remotePath, remoteFileName), content);

        }

      }
    }
    // return;
    for (let remoteFile of remoteFiles) {
      if (!remoteFile.filename.includes("___")) {
        continue;
      }
      let fileParse = path.parse(remoteFile.filename);
      let [name, hash] = fileParse.name.split("___");
      const localFileName = name + fileParse.ext;
      const localFile = localFiles.find((l) => l.filename === localFileName);


      if (!localFile) {// 本地文件不存在，或者已删除
        Logger.info("download file(not found)", remoteFile.filepath);
        let content = await this.client.getFileContents(remoteFile.filepath);
        await fs.writeFile(path.join(localPath, localFileName), content.toString());
      } else if (localFile.hash == hash) { // hash
        isDev && Logger.info("skip download file(hash match)", remoteFile.filepath);
      } else {
        // hash不一致
        if (localFile.modifiedTime < remoteFile.modifiedTime) {
          Logger.info("download file(hash no match)", remoteFile.filepath);
          let content = await this.client.getFileContents(remoteFile.filepath);
          await fs.writeFile(path.join(localPath, localFileName), content.toString());
        } else {
          isDev && Logger.info("skip download file(time no match)", remoteFile.filepath);
        }
      }
    }
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

// function debounce(func, delay) {
//   let timeoutId;
//   let status: number = 0;
//   return async function c(...args) {
//     console.log("debounce", status);
//     const context = this;
//     if (status == 0) {
//       console.log("定时器还未运行，直接取消");
//       // 清除之前的定时器
//       clearTimeout(timeoutId);
//       timeoutId = null;
//     } else if (status == 1) {
//       console.log("定时器已经运行，函数还没有完成，等待");
//       while (true) {
//         if (status == 1) {
//           await sleep(300);
//         } else if (status == 2) {
//           status = 0;
//           break;
//         }
//       }

//       c.apply(context, args);
//     } else if (status == 2) {
//       console.log("函数已经完成", timeoutId);
//       status = 0;
//     }
//     // 设置新的定时器
//     timeoutId = setTimeout(async () => {
//       status = 1;
//       await func.apply(context, args);
//       status = 2;
//     }, delay);
//   };
// }

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
