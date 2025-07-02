
import { isPortUse } from "./checkport.mjs";
import { Logger } from "../log.mjs";

export async function execFallback(port: number, callback: (port: number) => void) {
  while (1) {
    let isUse = await isPortUse(port);
    // Logger.debug("isUse: ", port, isUse);
    if (isUse) {
      port++;
    } else {
      callback(port);
      break;
    }
  }
  return port;
}
