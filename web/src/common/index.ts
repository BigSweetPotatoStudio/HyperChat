// import querystring from 'querystring'

import { sleep } from "./sleep";

export * from "./util";

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


export function getFirstCharacter(str) {
  if (str == null || str.length === 0) {
    return "";
  }

  // 使用正则表达式匹配第一个emoji或者普通的字符
  const match = str.match(/\p{Extended_Pictographic}|\S/u);
  return match ? match[0] : null;
}
export function getFirstEmoji(str: string): string | null {
  if (!str || str.length === 0) {
    return null;
  }

  // 使用正则表达式匹配第一个emoji
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const match = str.match(emojiRegex);
  return match ? match[0] : null;
}