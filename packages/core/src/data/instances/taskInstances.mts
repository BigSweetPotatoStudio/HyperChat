import { Data } from "../base/data.mjs";
import type { KnowledgeStore, Task } from "../../shared/types.mjs";

export const KNOWLEDGE_BASE = new Data(
  "knowledge_base.json",
  {
    dbList: [] as Array<KnowledgeStore>,
  },
  {
    sync: false,
  }
);

export const TaskList = new Data(
  "tasklist.json",
  {
    data: [] as Array<Task>,
  },
  {
    sync: true,
  }
);