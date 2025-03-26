// import { Embeddings } from "@langchain/core/embeddings";
import path from "path";
import { appDataDir, Logger } from "ts/polyfills/index.mjs";

// import { FeatureExtraction } from "../common/model.mjs";
import {
  KNOWLEDGE_BASE,
  KNOWLEDGE_Resource,
  KNOWLEDGE_Store,
} from "../../../common/data";
import { v4 } from "uuid";
import { zx } from "../es6.mjs";
import { MyRag } from "./lib.mjs";
const { fs } = zx;
// Save the vector store to a directory

// class MyEmbeddings extends Embeddings {
//   constructor() {
//     super({});
//   }
//   async init(model: string) {
//     return await FeatureExtraction.getInstance(model);
//   }
//   async embedDocuments(documents: string[]): Promise<number[][]> {
//     return FeatureExtraction.embeddings(documents);
//   }
//   embedQuery(document: string): Promise<number[]> {
//     return FeatureExtraction.embedding(document);
//   }
// }
const basedirectory = path.join(appDataDir, "vectordb");
fs.ensureDirSync(basedirectory);

const fileirectory = path.join(appDataDir, "files");
fs.ensureDirSync(fileirectory);
class Store {
  async addResource(store: KNOWLEDGE_Store, r: KNOWLEDGE_Resource) {
    let storeKey = store.key;
    const storePath = path.join(basedirectory, storeKey + ".db");
    let ragapp = new MyRag();
    await ragapp.init(storePath, store);
    let res;
    if (r.type === "file") {
      let x = path.parse(r.filepath);
      if (x.ext === ".pdf") {
        r.name = x.name + x.ext;
        let filepath = path.join(fileirectory, r.key + ".pdf");
        await fs.copy(r.filepath, filepath);
        r.filepath = path.relative(appDataDir, filepath);
        res = await ragapp.addPdf(filepath);
        console.log("addPdf", res);
      } else {
        throw new Error("Not implemented");
      }
    } else {
      let text = r.text;
      let filepath = path.join(fileirectory, r.key + ".txt");
      fs.writeFileSync(filepath, text);
      r.name = text.split("\n").filter((x) => x.trim())[0];
      r.filepath = path.relative(appDataDir, filepath);
      delete r.text;
      res = await ragapp.addText(text);
      // console.log("addText", res);
    }
    r.entriesAdded = res.entriesAdded;
    r.uniqueId = res.uniqueId;
    r.loaderType = res.loaderType;
    return r;
  }
  async removeResource(store: KNOWLEDGE_Store, r: KNOWLEDGE_Resource) {
    let storeKey = store.key;
    const storePath = path.join(basedirectory, storeKey + ".db");
    let ragapp = new MyRag();
    await ragapp.init(storePath, store);
    await ragapp.remove(r.uniqueId);
    fs.removeSync(path.join(appDataDir, r.filepath));
  }

  async delete(store: KNOWLEDGE_Store) {
    let storeKey = store.key;
    const storePath = path.join(basedirectory, storeKey + ".db");
    let ragapp = new MyRag();
    // await ragapp.init(storePath, store);
    // delete ragapp.app;
    try {
      fs.removeSync(storePath);
    } catch (e) {
      Logger.error("delete knowledge_base failed", storeKey, e);
      throw e;
    }

    let find = KNOWLEDGE_BASE.initSync().dbList.find((x) => (x.key = storeKey));
    if (find) {
      for (let r of find.resources) {
        try {
          fs.removeSync(path.join(appDataDir, r.filepath));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
  async search(store: KNOWLEDGE_Store, query: string, k: number) {
    let storeKey = store.key;
    const storePath = path.join(basedirectory, storeKey + ".db");
    let ragapp = new MyRag();
    await ragapp.init(storePath, store);
    return await ragapp.search(query);
  }
  async searchByName(store_name: string, query: string, k: number = 5) {
    let db = KNOWLEDGE_BASE.initSync().dbList.find((x) => x.name == store_name);
    if (!db) {
      throw new Error("Knowledge base not found");
    }
    return await this.search(db, query, k);
  }
  async addResourceByName(
    store_name: string,
    r: {
      key?: string;
      type: "text";
      text: string;
    }
  ) {
    let db = KNOWLEDGE_BASE.initSync().dbList.find((x) => x.name == store_name);
    if (!db) {
      throw new Error("Knowledge base not found");
    }
    r.key = r.key || v4();
    let res = await this.addResource(db, r as any);
    if (!Array.isArray(db.resources)) {
      db.resources = [];
    }
    db.resources.push(res);
    await KNOWLEDGE_BASE.save();
    return res;
  }
}

export const store = new Store();

// let embeddings = new BgeM3Embeddings({});

// export async function test() {
//   let e = await embeddings.embedQuery("Hello, world!");

//   console.log("embeddings.embedQuery", e);
// }

// const vectorStore = await HNSWLib.fromDocuments([], embeddings);
// await vectorStore.save(directory);

// // Load the vector store from the same directory
// const loadedVectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());

// // vectorStore and loadedVectorStore are identical
// await loadedVectorStore.similaritySearch("hello world", 1);
