/**
 * A boolean constant that indicates whether the code is running in a standard browser environment.
 *
 * It checks for the existence of the `window` object and ensures that `window.ext` is not defined,
 * which might indicate a non-standard environment like Electron.
 *
 * @type {boolean}
 */
export const isOnBrowser = typeof window !== "undefined" ? !window.ext : false;
