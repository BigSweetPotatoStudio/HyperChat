// import querystring from 'querystring'

import { sleep } from "./sleep";

export * from "./util";

// console.log(process.env.NODE_ENV)
// let BASE_URL = ''
// // if (process.env.NODE_ENV === 'development') {
// //     BASE_URL = 'http://localhost:8001'
// // } else {

// export async function request(url: string, options = {} as any) {
//     if (!url.includes('?')) {
//         let querystr = querystring.stringify(options.query)
//         url = url + (querystr ? '?' + querystr : '')
//     }

//     options = Object.assign({}, options, {
//         "Content-Type": "application/json",
//         // 'Content-Type': 'application/x-www-form-urlencoded',
//     })
//     return fetch(BASE_URL + '/api' + url, options).then(res => res.json())
// }

// export { BASE_URL }
export * from "./request";

export async function retry(fn, count: number = 3, time: number) {
  while (count > 0) {
    try {
      return await fn();
    } catch (e) {
      count--;
      time && (await sleep(time));
      if (count == 0) {
        throw e;
      }
    }
  }
}
