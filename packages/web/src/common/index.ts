// import querystring from 'querystring'

import { sleep } from "./sleep";

export * from "./util";

export * from "./request";

/**
 * Retries an asynchronous function a specified number of times with a delay between retries.
 * @template T - The return type of the function to retry.
 * @param {() => Promise<T>} fn - The asynchronous function to retry.
 * @param {number} [count=3] - The maximum number of retry attempts. Defaults to 3.
 * @param {number} [time] - The delay in milliseconds between retries. If not provided, no delay.
 * @returns {Promise<T>} A promise that resolves with the result of the function if successful, or rejects if all retries fail.
 */
export async function retry<T>(fn: () => Promise<T>, count: number = 3, time?: number): Promise<T> {
  while (count > 0) {
    try {
      return await fn();
    } catch (e) {
      count--;
      time && (await sleep(time));
      if (count === 0) {
        throw e;
      }
    }
  }
  // This part should ideally not be reached if count > 0 and an error is always thrown on failure.
  // Added for type safety, though the loop's throw e should cover it.
  throw new Error("Retry failed after all attempts.");
}

/**
 * Extracts the first character (or emoji) from a string.
 * Handles Unicode characters and emojis correctly.
 * @param {string | null | undefined} str - The input string.
 * @returns {string | null} The first character/emoji, or an empty string if the input is null/empty, or null if no character is matched.
 */
export function getFirstCharacter(str: string | null | undefined): string | null {
  if (str == null || str.length === 0) {
    return "";
  }

  // Use regex to match the first extended grapheme cluster (which includes emojis and complex characters).
  const match = str.match(/\p{Extended_Pictographic}|\S/u);
  return match ? match[0] : null;
}

/**
 * Extracts the first emoji from a string.
 * @param {string} str - The input string.
 * @returns {string | null} The first emoji found, or null if no emoji is found or the input is empty.
 */
export function getFirstEmoji(str: string): string | null {
  if (!str || str.length === 0) {
    return null;
  }

  // Use regex to match the first extended pictographic (emoji).
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const match = str.match(emojiRegex);
  return match ? match[0] : null;
}