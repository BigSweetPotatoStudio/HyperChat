import { TokenTextSplitter } from "@langchain/textsplitters";

const textSplitter = new TokenTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0,
});

export const toolTextSplitter = async (text: string) => {
  const texts = await textSplitter.splitText(text);
  return texts;
};

const texts = await toolTextSplitter(`
  
12312313
  `);

console.log("texts", texts);
