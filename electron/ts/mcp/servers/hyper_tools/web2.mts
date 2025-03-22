import puppeteer, { Page } from "puppeteer-core";
// import * as ChromeLauncher from "chrome-launcher";
import path from "path";
import { ChromeLauncher, zx } from "ts/es6.mjs";

import { configSchema, getConfig, NAME } from "./lib.mjs";
import { z } from "zod";
import { Logger } from "ts/polyfills/polyfills.mjs";
const { fs } = zx;

// let mcpconfig = await getMCPConfg();

// let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
//   typeof configSchema
// >;
// // 连接浏览器的远程调试端口
// let Hyper_browserURL = config.browserURL || "http://localhost:9222";
// // 是否使用本地浏览器，如果为false则使用设置的端口调试浏览器
// let isAutoLauncher = config.browserURL != "false" || true;
// // 搜索引擎
// let searchEngine = config.SEARCH_ENGINE || "google";
// // 起始页
// let startingUrl =
//   config.startingUrl || "https://github.com/BigSweetPotatoStudio/HyperChat";
// // （可选）浏览器默认路径
// // (optional) Explicit path of intended Chrome binary
// // * If this `chromePath` option is defined, it will be used.
// // * Otherwise, the `CHROME_PATH` env variable will be used if set. (`LIGHTHOUSE_CHROMIUM_PATH` is deprecated)
// // * Otherwise, a detected Chrome Canary will be used if found
// // * Otherwise, a detected Chrome (stable) will be used
// let CHROME_PATH = config.chromePath || undefined;

let browser;
let launcher;

const newFlags = ChromeLauncher.Launcher.defaultFlags().filter(
  (flag) => flag !== "--disable-extensions" && flag !== "--mute-audio"
);
export async function createBrowser(log = false) {
  if (browser) {
    return browser;
  }
  let browserURL;
  if (getConfig().isAutoLauncher) {
    try {
      launcher = await ChromeLauncher.launch({
        startingUrl: getConfig().startingUrl,
        userDataDir: false,
        port: 9222,
        ignoreDefaultFlags: true,
        chromeFlags: newFlags,
        // handleSIGINT: true,
        logLevel: "silent",
        chromePath: getConfig().chromePath || undefined,
        // chromePath: "C:\\Users\\0laop\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe",
      });
      // console.log("Chrome debugging port: " + launcher.port);
      browserURL = `http://localhost:${launcher.port}`;
    } catch (e) {
      console.error(e);
    }
  } else {
    browserURL = getConfig().browserURL;
  }

  log && console.log("browserURL", browserURL);

  browser = await new Promise(async (resolve, reject) => {
    let t = setTimeout(() => {
      reject(
        new Error(
          "failed connect to browser, please close the browser, then try again"
        )
      );
    }, 3000);
    await puppeteer
      .connect({
        defaultViewport: null,
        browserURL: browserURL,
      })
      .then((b) => {
        clearTimeout(t);
        resolve(b);
      })
      .catch((e) => {
        reject(
          new Error(
            "failed connect to browser, please close the browser, then try again"
          )
        );
      });
  });
  log && console.log("browser connected");

  return browser;
  // let testPage = await browser.newPage();
  // await testPage.goto("https://www.google.com/search?q=hello");
  // await testPage.close();
}

// Add an addition tool

export const fetch = async (url: string) => {
  try {
    let browser = await createBrowser();
    let page = await browser.newPage();
    await page.goto(url);
    await Promise.race([page.waitForNetworkIdle(), sleep(3000)]);
    let md = (await executeClientScript(
      page,
      fs.readFileSync(path.join(__dirname, "./markdown.js"), "utf-8").toString()
    )) as string;
    await page.close();
    return md;
  } catch (e) {
    Logger.error(e);
    throw e;
  } finally {
  }
};

export const search = async (words: string) => {
  try {
    let browser = await createBrowser();

    let res = [];
    let page = await browser.newPage();
    if (getConfig().SEARCH_ENGINE == "bing") {
      await page.goto(
        `https://www.bing.com/search?q=` + encodeURIComponent(words)
      );
      await Promise.race([page.waitForNetworkIdle(), sleep(3000)]);
      res = await executeClientScript(
        page,
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
      await page.close();
    } else {
      await page.goto(
        `https://www.google.com/search?q=` + encodeURIComponent(words)
      );
      await Promise.race([page.waitForNetworkIdle(), sleep(3000)]);
      res = await executeClientScript(
        page,
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
      await page.close();
    }
    return res;
  } catch (e) {
    Logger.error(e);
    throw e;
  } finally {
  }
};

async function executeClientScript<T>(page: Page, script: string): Promise<T> {
  try {
    // Wrap script in promise with timeout

    const wrappedScript = `
        new Promise((resolve, reject) => {
            ${script}
        })
      `;

    const result = await Promise.race([
      page.evaluate(wrappedScript),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Script execution timed out")), 5000)
      ),
    ]);

    return result as T;
  } catch (error) {
    throw error;
  }
}

export async function sleep(t) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
