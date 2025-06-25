// import { taskHistory } from "../../common/data";

// export enum CommandStatus {
//   SUCCESS = "success",
//   ERROR = "error",
//   RUNING = "runing",
// }

// export class CommandHistory {
//   history: Array<{
//     command: string;
//     args: Array<any>;
//     status: CommandStatus;
//     result?: any;
//     error?: string;
//     timestamp?: number;
//   }> = [];

//   add(command: string, args: Array<any>) {
//     this.history.push({
//       command,
//       args,
//       status: CommandStatus.RUNING,
//       timestamp: Date.now(),
//     });
//   }
//   get() {
//     return this.history;
//   }
//   last() {
//     return this.history[this.history.length - 1];
//   }
//   async save() {
//     taskHistory.get().history = this.history;
//     await taskHistory.saveSync();
//   }
// }

// export const commandHistory = new CommandHistory();
