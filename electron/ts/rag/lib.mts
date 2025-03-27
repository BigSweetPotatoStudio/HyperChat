import type { RAGApplication } from "@llm-tools/embedjs";
import { GPT_MODELS, KNOWLEDGE_Store } from "../../../common/data";
import {
  LibSqlDb,
  OpenAiEmbeddings,
  PdfLoader,
  RAGApplicationBuilder,
  TextLoader,
} from "ts/es6.mjs";

export class MyRag {
  app: RAGApplication;
  async search(query: string, top) {
    return (await this.app.search(query)).slice(0, top);
  }
  remove(uniqueId: string) {
    return this.app.deleteLoader(uniqueId);
  }
  async addText(text: string) {
    return this.app.addLoader(new TextLoader({ text: "..." }));
  }
  async addPdf(filepath: string) {
    return this.app.addLoader(new PdfLoader({ filePathOrUrl: filepath }));
  }
  async init(storePath: string, store: KNOWLEDGE_Store) {
    let gpt_m = GPT_MODELS.initSync().data.find((x) => x.key == store.model);
    if (gpt_m == null) {
      throw new Error("Model not found");
    }
    // console.log("Using model", gpt_m);
    this.app = await new RAGApplicationBuilder()
      .setModel("NO_MODEL")
      .setEmbeddingModel(
        new OpenAiEmbeddings({
          model: gpt_m.model,
          configuration: { baseURL: gpt_m.baseURL },
          apiKey: gpt_m.apiKey,
        })
      )
      .setVectorDatabase(new LibSqlDb({ path: storePath }))
      .build();
  }
}
