import querystring from "querystring";
import { fetch } from "zx";
console.log("NODE_ENV: ", process.env.NODE_ENV);
let BASE_URL = "";

BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

console.log(BASE_URL);

export async function request(url: string, options = {} as any) {
  if (!url.includes("?")) {
    let querystr = querystring.stringify(options.query);
    url = url + (querystr ? "?" + querystr : "");
  }
  if (options.json) {
    options = Object.assign({}, options, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.json),
    });
  }
  return fetch(BASE_URL + url, options).then((res) => res.json());
}
