import { electronData } from "./data.mjs";

class Progress {
  name = "";
  loaded = 0;
  total = 0;
  status: "progress" | "success" = "progress";
  progress = 0;
  constructor(name: string, loaded: number, total: number) {
    this.name = name;
    this.loaded = loaded;
    this.total = total;
  }
  calcProgress() {
    this.progress = Math.round((this.loaded / this.total) * 10000) / 100;
  }
}

class ProgressList {
  data: Array<Progress> = [];
  reset() {
    this.data = [];
  }
  setProgress(name: string, loaded: number, total: number) {
    let progress = this.data.find((x) => x.name == name);
    if (!progress) {
      progress = new Progress(name, loaded, total);
      this.data.push(progress);
    }
    progress.loaded = loaded;
    progress.total = total;
    progress.calcProgress();
    if (progress.loaded == progress.total) {
      progress.status = "success";
    }
    electronData.save();
  }
  getData() {
    return this.data;
  }
}

export const progressList = new ProgressList();
