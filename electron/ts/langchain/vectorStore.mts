// import { HNSWLib } from "./myhnswlib.mjs";
// import { Embeddings } from "@langchain/core/embeddings";
// import path from "path";
// import { appDataDir } from "ts/polyfills/index.mjs";

// import { FeatureExtraction } from "../common/model.mjs";
// import { toolTextSplitter } from "./textsplitters.mjs";
// import {
//   KNOWLEDGE_BASE,
//   KNOWLEDGE_Resource,
//   KNOWLEDGE_Store,
// } from "../../../common/data";
// import { v4 } from "uuid";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { zx } from "../es6.mjs";
// const { fs } = zx;
// // Save the vector store to a directory


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
// const basedirectory = path.join(appDataDir, "vectordb");
// fs.ensureDirSync(basedirectory);

// const markdowndirectory = path.join(appDataDir, "markdown");
// fs.ensureDirSync(markdowndirectory);
// class Store {
//   async addResource(store: KNOWLEDGE_Store, r: KNOWLEDGE_Resource) {
//     let storeKey = store.key;
//     let embeddings = new MyEmbeddings();
//     await embeddings.init(store.model);
//     const storeDirectory = path.join(basedirectory, storeKey);
//     let vectorStore;

//     // vectorStore = await HNSWLib.fromDocuments([], embeddings);
//     if (fs.existsSync(storeDirectory)) {
//       vectorStore = await HNSWLib.load(storeDirectory, embeddings);
//     } else {
//       vectorStore = await HNSWLib.fromDocuments([], embeddings);
//     }

//     let text;
//     if (r.type === "file") {
//       let x = path.parse(r.filepath);
//       if (x.ext === ".pdf") {
//         r.name = x.name + x.ext;

//         const loader = new PDFLoader(r.filepath);
//         const docs = await loader.load();
//         // console.log("docs", docs);
//         await vectorStore.addDocuments(docs);
//         await vectorStore.save(storeDirectory);
//         return r;
//       } else {
//         throw new Error("Not implemented");
//       }
//     } else {
//       text = r.text;
//       let filepath = path.join(markdowndirectory, r.key + ".md");
//       fs.writeFileSync(filepath, text);
//       r.name = text.split("\n").filter((x) => x.trim())[0];
//       r.filepath = filepath;
//       delete r.text;
//     }

//     let texts = await toolTextSplitter(text);
//     let date = new Date().getTime();
//     const documents = texts.map((text) => {
//       return {
//         pageContent: text,
//         metadata: {
//           resourceKey: r.key,
//           date: date,
//         },
//       };
//     });
//     await vectorStore.addDocuments(documents);
//     await vectorStore.save(storeDirectory);
//     return r;
//   }
//   async removeResource(store: KNOWLEDGE_Store, r: KNOWLEDGE_Resource) {
//     let storeKey = store.key;
//     let embeddings = new MyEmbeddings();
//     await embeddings.init(store.model);
//     const storeDirectory = path.join(basedirectory, storeKey);
//     let vectorStore: HNSWLib;
//     if (fs.existsSync(storeDirectory)) {
//       vectorStore = await HNSWLib.load(storeDirectory, embeddings);
//     } else {
//       vectorStore = await HNSWLib.fromDocuments([], embeddings);
//     }
//     for (let [i, v] of vectorStore.docstore._docs) {
//       // console.log("deleteDocument", i, v);
//       if (v.metadata.resourceKey === r.key) {
//         vectorStore.deleteDocument(i);
//       }
//     }
//     await vectorStore.save(storeDirectory);
//     fs.removeSync(r.filepath);
//   }

//   delete(store: KNOWLEDGE_Store) {
//     let storeKey = store.key;
//     const storeDirectory = path.join(basedirectory, storeKey);
//     fs.removeSync(storeDirectory);
//     let find = KNOWLEDGE_BASE.initSync({ force: true }).dbList.find(
//       (x) => (x.key = storeKey)
//     );
//     if (find) {
//       for (let r of find.resources) {
//         try {
//           fs.removeSync(path.join(appDataDir, r.filepath));
//         } catch (e) {
//           console.error(e);
//         }
//       }
//     }
//   }
//   async search(store: KNOWLEDGE_Store, query: string, k: number) {
//     let storeKey = store.key;
//     let embeddings = new MyEmbeddings();
//     await embeddings.init(store.model);
//     const storeDirectory = path.join(basedirectory, storeKey);
//     let vectorStore: HNSWLib;
//     if (fs.existsSync(storeDirectory)) {
//       vectorStore = await HNSWLib.load(storeDirectory, embeddings);
//     } else {
//       vectorStore = await HNSWLib.fromDocuments([], embeddings);
//     }
//     let similaritySearchResults =
//       await vectorStore.similaritySearchVectorWithScore(
//         await embeddings.embedQuery(query),
//         k
//       );
//     let res = [];
//     for (const [doc, score] of similaritySearchResults) {
//       // console.log(
//       //   `* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`
//       // );
//       res.push({
//         resourceKey: doc.metadata.resourceKey,
//         date: doc.metadata.date,
//         pageContent: doc.pageContent,
//         score: score,
//       });
//     }
//     return res;
//   }
//   async searchByName(store_name: string, query: string, k: number = 5) {
//     let db = KNOWLEDGE_BASE.initSync({ force: true }).dbList.find(
//       (x) => x.name == store_name
//     );
//     if (!db) {
//       throw new Error("Knowledge base not found");
//     }
//     return await this.search(db, query, k);
//   }
//   async addResourceByName(
//     store_name: string,
//     r: {
//       key?: string;
//       type: string;
//       markdown: string;
//     }
//   ) {
//     let db = KNOWLEDGE_BASE.initSync({ force: true }).dbList.find(
//       (x) => x.name == store_name
//     );
//     if (!db) {
//       throw new Error("Knowledge base not found");
//     }
//     r.key = r.key || v4();
//     let res = await this.addResource(db, r as any);
//     if (!Array.isArray(db.resources)) {
//       db.resources = [];
//     }
//     db.resources.push(res);
//     await KNOWLEDGE_BASE.save();
//     return res;
//   }
// }

// export const store = new Store();

// // let embeddings = new BgeM3Embeddings({});

// // export async function test() {
// //   let e = await embeddings.embedQuery("Hello, world!");

// //   console.log("embeddings.embedQuery", e);
// // }

// // const vectorStore = await HNSWLib.fromDocuments([], embeddings);
// // await vectorStore.save(directory);

// // // Load the vector store from the same directory
// // const loadedVectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());

// // // vectorStore and loadedVectorStore are identical
// // await loadedVectorStore.similaritySearch("hello world", 1);
