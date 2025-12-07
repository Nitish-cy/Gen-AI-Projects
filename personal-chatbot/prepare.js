import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
// import { Metadata } from "pdf-parse/lib/pdf.js/v1.10.100/build/pdf";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
// const vectorStore = new PineconeStore(embeddings, {
//   pineconeIndex,
//   maxConcurrency: 5,
// });

export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
  maxConcurrency: 5,
});

export async function indexTheDocument(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: false });
  const doc = await loader.load();
  //console.log(doc[0].pageContent);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  const texts = await splitter.splitText(doc[0].pageContent);
  const document = texts.map((chunk) => {
    return {
      pageContent: chunk,
      metadata: doc[0].metadata,
    };
  });
  console.log(document);
  await vectorStore.addDocuments(document);

  // console.log(texts);
}
