// This file (model.js) contains all the logic for loading the model and running predictions.

// import { pipeline, env } from "@xenova/transformers";
import { appDataDir } from "../const.mjs";
import path from "path";
import { progressList } from "./progress.mjs";
import type { FeatureExtractionPipeline } from "@xenova/transformers";
import { fs } from "zx";
import { electronData } from "./data.mjs";

export class FeatureExtraction {
  // NOTE: Replace this with your own task and model
  static task = "feature-extraction";
  // static model = "Xenova/all-MiniLM-L6-v2"; // Xenova/all-MiniLM-L6-v2  Xenova/bge-m3
  static instance: FeatureExtractionPipeline = null;
  static async getInstance(model: string) {
    if (this.instance === null) {
      // Dynamically import the Transformers.js library
      let { pipeline, env } = await import(
        /* webpackIgnore: true */ "@xenova/transformers"
      );
      // NOTE: Uncomment this to change the cache directory
      //   env.localModelPath = path.join(appDataDir, "models");
      env.cacheDir = path.join(appDataDir, "cache");
      progressList.reset();

      this.instance = await pipeline(
        this.task as "feature-extraction",
        "Xenova/" + model,
        {
          progress_callback: (p) => {
            // console.log("progress_callback: ", p);
            if (p.status == "progress") {
              progressList.setProgress(p.file, p.loaded, p.total);
            }
          },
        }
      );
    }
    electronData.get().downloaded[model] = true;
    electronData.save();
    return this.instance;
  }
  static async embeddings(texts: string[]) {
    if (texts.length === 0) {
      return [];
    }
    // const texts = ["What is BGE M3?", "Defination of BM25"];
    const embeddings = await this.instance(texts, {
      pooling: "mean",
      normalize: true,
    });
    // console.log(embeddings);

    // console.log(embeddings.tolist()); // Convert embeddings to a JavaScript list

    return embeddings.tolist();
  }
  static async embedding(text: string) {
    // const texts = ["What is BGE M3?", "Defination of BM25"];
    const embeddings = await this.instance(text, {
      pooling: "mean",
      normalize: true,
    });

    return embeddings.tolist()[0];
  }
}

// const embed_fun: any = {};
// embed_fun.sourceColumn = "text";
// embed_fun.embed = async function (batch) {
//   console.log("batch", batch);
//   let result = [];
//   // Given a batch of strings, we will use the `pipe` function to get
//   // the vector embedding of each string.
//   for (let text of batch) {
//     // 'mean' pooling and normalizing allows the embeddings to share the
//     // same length.
//     const res = await BgeM3.instance(text, {
//       pooling: "mean",
//       normalize: true,
//     });
//     result.push(Array.from(res["data"]));
//   }
//   return result;
// };

// import * as lancedb from "@lancedb/lancedb";

// const db = await lancedb.connect(path.join(appDataDir, "vectordb"));

// You can also import any other data, but make sure that you have a column
// for the embedding function to use.
// console.log(
//   "数据保存成功！",
//   (await BgeM3.embedding("Cherry")).embedding.length
// );
// async function createTable() {
//   const data = [
//     { id: 1, item: "Cherry", type: "fruit" },
//     { id: 2, item: "Carrot", type: "vegetable" },
//     { id: 3, item: "Potato", type: "vegetable" },
//     { id: 4, item: "Apple", type: "fruit" },
//     { id: 5, item: "Banana", type: "fruit" },
//   ] as any;

//   for (let d of data) {
//     d.vector = await BgeM3.embedding(d.item);
//   }

//   fs.writeFile("tmp/data.json", JSON.stringify(data, null, 2));
//   let tableNames = await db.tableNames();
//   let table: lancedb.Table;
//   if (tableNames.includes("my_table2")) {
//     table = await db.openTable("my_table2");
//   } else {
//     table = await db.createTable("my_table2", data);
//   }
//   // const table = await db.createTable("my_table2", data);
//   const results = await table
//     .vectorSearch(await BgeM3.embedding("a sweet fruit to eat"))
//     .limit(20)
//     .toArray();
//   console.log(results.map((x) => x.item));
// }
// createTable();
// const table = await db.createTable("my_table2", data);

// const results = await table
//   .vectorSearch((await BgeM3.embedding("a sweet fruit to eat")).embedding)
//   .limit(20)
//   .toArray();
// console.log(results);
// Create the table with the embedding function
// const table: any = await db.openTable("food_table");

// const table = await db.createTable("food_table", data);

// console.log("数据保存成功！");

// const searchQuery: lancedb.VectorQuery = table.search(
//   "a sweet fruit to eat"
// ) as any;
// const results = await searchQuery
//   .limit(2) // 限制返回2条结果
//   .toArray(); // 执行查询并收集结果

// console.log(results);
