import querystring from "querystring";
import { call } from "./call";
import { Modal, message } from "antd";
import { log } from "zx/core";
import { config } from "./config";

console.log("NODE_ENV: ", process.env.NODE_ENV);

export async function request(
  url: string,
  options = {} as any,
  BASE_URL = process.env.REACT_APP_REMOTE_URL,
) {
  // let token = localStorage.getItem(".token");
  let token = await call("readFile", [".token"]);
  options.headers = Object.assign({}, options.headers, {
    Authorization: "Bearer " + token,
  });
  if (options.body instanceof FormData) {
  } else {
    options = Object.assign({}, options, {
      headers: Object.assign({}, options.headers, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(options.body),
    });
  }
  return fetch(BASE_URL + url, options)
    .then((res) => {
      if (res.status === 401) {
        throw new Error("未登录");
      }
      return res;
    })
    .then((res) => res.json())
    .then((res) => {
      if (!res.success) {
        // message.error(res.message)
        !options.hideMsg &&
          res.message &&
          Modal.error({
            title: "提示",
            content: res.message,
          });
        throw new Error(res.message);
      }
      return res;
    });
}
