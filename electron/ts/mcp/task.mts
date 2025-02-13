import Logger from "electron-log";
import { TaskList } from "../../../common/data";
import cron from "node-cron";
let tArr = [];

export function start() {
  console.log(`Starting tasks ${TaskList.initSync().data.length}`);
  for (let task of TaskList.initSync().data) {
    let t = cron.schedule(task.cron, () => {
      Logger.log("Running task", task.name);
    });
    tArr.push(t);
  }
}

export function stop() {
  console.log(`Stopping tasks ${tArr.length}`);
  for (let t of tArr) {
    t.stop();
  }
}