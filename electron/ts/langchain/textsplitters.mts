import { TokenTextSplitter } from "@langchain/textsplitters";

const textSplitter = new TokenTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0,
});

export const toolTextSplitter = async (text) => {
  const texts = await textSplitter.splitText(text);
  return texts;
};

const texts = await toolTextSplitter(`
  
sk-4a9f875b950045638db1f7d712162fb3
  `);

console.log("texts", texts);
