import { BrowserWindow } from "electron";
import { Logger } from "ts/polyfills/index.mjs";
import path from "path";
import { sleep } from "ts/common/util.mjs";
import { zx } from "ts/es6.mjs";
import { getConfig } from "./lib.mjs";
const { fs } = zx;

export async function fetch(url: string) {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    webPreferences: {
      backgroundThrottling: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  // win.webContents.openDevTools();
  try {
    // win.webContents.session.webRequest.onHeadersReceived(
    //   (details, callback) => {
    //     // log.log(
    //     //   details.url,
    //     //   details.responseHeaders["content-security-policy"]
    //     // );
    //     const cspIndex = Object.keys(details.responseHeaders).find(
    //       (key) => key.toLowerCase() === "content-security-policy"
    //     );
    //     if (cspIndex) {
    //       delete details.responseHeaders[cspIndex]; // 删除CSP头
    //     }

    //     callback({ cancel: false, responseHeaders: details.responseHeaders });
    //   }
    // );
    Logger.info("Page loadeding: " + url);
    await win.loadURL(url, {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    });

    // 等待页面加载完成
    await sleep(3000);
    await Promise.race([
      new Promise((resolve) => {
        win.webContents.on("did-finish-load", () => {
          resolve(0);
        });
      }),
      sleep(3000),
    ]);
    Logger.info("Page loaded: " + url, __dirname);
    let md = await executeClientScript(
      win,
      fs.readFileSync(path.join(__dirname, "./turndown.js"), "utf-8").toString()
    );
    return md as string;
  } catch (e) {
    Logger.error(e);
    throw new Error("Failed to fetch URL");
  } finally {
    win.close();
  }
}

export async function search(words: string) {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    webPreferences: {
      backgroundThrottling: true,
    },
  });
  // win.webContents.openDevTools();

  try {
    if (getConfig().SEARCH_ENGINE == "bing") {
      await win.loadURL(
        `https://www.bing.com/search?q=` + encodeURIComponent(words),
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        }
      );

      // 等待页面加载完成
      await Promise.race([
        new Promise((resolve) => {
          win.webContents.on("did-finish-load", () => {
            resolve(0);
          });
        }),
        sleep(3000),
      ]);

      Logger.info("Page loaded");
      let res = await executeClientScript(
        win,
        `
        let resArr = [];
  
  let arr = document.querySelectorAll("#b_results .b_algo");
  
  for (let x of arr) {
        resArr.push({
          title: x.querySelector("h2").innerText,
          url: x.querySelector("h2 a").href,
          description: x.querySelector("p").innerText,
        });
  }
    resolve(resArr);
        `
      );

      return res as any[];
    } else {
      await win.loadURL(
        `https://www.google.com/search?q=` + encodeURIComponent(words),
        {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        }
      );

      // 等待页面加载完成
      await Promise.race([
        new Promise((resolve) => {
          win.webContents.on("did-finish-load", () => {
            resolve(0);
          });
        }),
        sleep(3000),
      ]);

      Logger.info("Page loaded");
      let res = await executeClientScript(
        win,
        `
      let resArr = [];

let arr = document.querySelector("#search").querySelectorAll("span>a");
for (let a of arr) {
  if (a.querySelector("h3")) {
    try {
      let p =
        a.parentElement.parentElement.parentElement.parentElement.parentElement;
      let res = {
        title: a.querySelector("h3").innerText,
        url: a.href,
        description: p.children[p.children.length - 1].innerText,
      };
      resArr.push(res);
    } catch (error) {
      let res = {
        title: a.querySelector("h3").innerText,
        url: a.href,
      };
      resArr.push(res);
    }
  }
}
  resolve(resArr);
      `
      );

      return res as any[];
    }
  } catch (e) {
    Logger.error(e);
    throw new Error("Search failed");
  } finally {
    win.close();
  }
}

async function executeClientScript<T>(
  win: Electron.BrowserWindow,
  script: string,
  options: any = {}
): Promise<T> {
  const { timeout = 5000, userGesture = true } = options;

  try {
    // Wrap script in promise with timeout

    const wrappedScript = `
      new Promise((resolve, reject) => {
          ${script}
      })
    `;
    //   const wrappedScript = `
    //   new Promise((resolve, reject) => {
    //     resolve("error openUrl");
    //   })
    //  `;

    const result = await Promise.race([
      win.webContents.executeJavaScript(wrappedScript, userGesture),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Script execution timed out")),
          timeout
        )
      ),
    ]);
    console.log("error openUrl", result);
    return result as T;
  } catch (error) {
    Logger.error("Error executing client script:", error);
    throw error;
  }
}
