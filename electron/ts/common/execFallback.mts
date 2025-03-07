
import { isPortUse } from "./checkport.mjs";

export async function execFallback(port, callback) {
  while (1) {
    let isUse = await isPortUse(port);
    // console.log("isUse: ", port, isUse);
    if (isUse) {
      port++;
    } else {
      callback(port);
      break;
    }
  }
  return port;
}
