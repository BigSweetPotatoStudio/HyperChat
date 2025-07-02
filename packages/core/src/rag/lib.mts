import type { RAGApplication } from "@llm-tools/embedjs";
import { AI_MODELS, KnowledgeStore } from "../shared/data.mjs";
import {
  LibSqlDb,
  OpenAiEmbeddings,
  PdfLoader,
  RAGApplicationBuilder,
  TextLoader,
} from "../es6.mjs";
import { Logger } from "../log.mjs";

export class MyRag {
  app!: RAGApplication;
  async search(query: string, top: number) {
    return (await this.app.search(query)).slice(0, top);
  }
  remove(uniqueId: string) {
    return this.app.deleteLoader(uniqueId);
  }
  async addText(_text: string) {
    return this.app.addLoader(new TextLoader({ text: "..." }));
  }
  async addPdf(filepath: string) {
    return this.app.addLoader(new PdfLoader({ filePathOrUrl: filepath }));
  }
  async init(storePath: string, store: KnowledgeStore) {
    let gpt_m = (await AI_MODELS.init()).data.find((x) => x.key == store.model);
    if (gpt_m == null) {
      throw new Error("Model not found");
    }
    // Logger.debug("Using model", gpt_m);
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
