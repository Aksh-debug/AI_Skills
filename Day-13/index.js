import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { rawDocuments } from "./docs.js";
import { CohereEmbeddings, CohereRerank } from "@langchain/cohere";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { EnsembleRetriever } from "@langchain/classic/retrievers/ensemble";
import { ContextualCompressionRetriever } from "@langchain/classic/retrievers/contextual_compression";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";

import "dotenv/config";

async function createChunks() {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 220,
      overlap: 30,
    });

    const docs = await splitter.createDocuments(rawDocuments);

    const chunks = await splitter.splitDocuments(docs);
    console.log(
      `------------- STEP1 : Splitted docs into ${chunks.length} chunks------------`,
    );
    // console.log(chunks);
    return chunks;
  } catch (error) {
    console.log(error);
  }
}

async function buildHybridRetriever(chunks) {
  const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
    inputType: "search_document",
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

  const vectorRetriever = vectorStore.asRetriever({ k: 4 });

  const keywordRetriever = BM25Retriever.fromDocuments(chunks, { k: 4 });

  const hybridRetriever = new EnsembleRetriever({
    retrievers: [vectorRetriever, keywordRetriever],
    weights: [0.6, 0.4],
  });

  console.log(
    `---------- STEP 2 : Hybrid Retriever ready (vector  + keyword )------------`,
  );
  return hybridRetriever;
}

function buildingReRankRetriever(hybridRetriever) {
  const reRanker = new CohereRerank({
    apiKey: process.env.COHERE_API_KEY,
    model: "rerank-english-v3.0",
    topN: 3,
  });

  const reRankRetriever = new ContextualCompressionRetriever({
    baseRetriever: hybridRetriever,
    baseCompressor: reRanker,
  });

  console.log(`--------------STEP 3: Reranking Retriever Ready-----------`);
  return reRankRetriever;
}

const CONFIDENCE_THRESHOLD = 0.5;

function confidenceGuard(reRankedDocs) {
  if (reRankedDocs.length === 0) return false;
  const topScore = reRankedDocs[0].metadata.relevanceScore;
  return topScore !== undefined && topScore >= CONFIDENCE_THRESHOLD;
}

function buildGenerationChain() {
  const promptTemplate = `You are CreditSense, a loan policy assistant. Answer the question using ONLY the context below.
    If the context does not contain the answer, say exactly: "I don't have enough information in the policy documents to answer that."

    Context: 
    {context}

    Question: {question}

    Answer:
    `;

  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);

  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  console.log(`----------- STEP 4: Generation chain ready ------------`);
  return chain;
}

async function answerQuestion({ reRankRetriever, chain }, question) {
  console.log(`Question : ${question}`);

  const reRankedDocs = await reRankRetriever.invoke(question);

  if (!confidenceGuard(reRankedDocs)) {
    console.log(
      "Answer: I don't have enough information in the policy documents to answer that.",
    );
    console.log(
      "(confidence guard fired — top rerank score too low or no results)",
    );
    return;
  }

  const context = reRankedDocs.map((doc) => doc.pageContent).join("\n\n");

  const answer = await chain.invoke({ context, question });

  console.log(`Answer: ${answer}`);
  console.log(
    "Top source:",
    reRankedDocs[0].metadata.source,
    "| relevanceScore:",
    reRankedDocs[0].metadata.relevanceScore?.toFixed(3),
  );
}

async function main() {
  const chunks = await createChunks();
  const hybridRetriever = await buildHybridRetriever(chunks);
  const reRankRetriever = buildingReRankRetriever(hybridRetriever);
  const chain = buildGenerationChain();

  const pipeline = { reRankRetriever, chain };


  // Test 1: exact policy-code query — the kind of query that used to fail
  // with vector-only search before your Day 9 hybrid search fix.
  await answerQuestion(
    pipeline,
    "What is the minimum credit score for policy OPT-25FPS?",
  );

  // Test 2: a normal semantic query, no exact code involved.
  await answerQuestion(pipeline, "What documents do I need for a home loan?");

  // Test 3: an out-of-domain trap query — should trigger the confidence guard,
  // same check you built on Day 11.
  await answerQuestion(pipeline, "What is the capital of France?");
}

main().catch((err)=>{
    console.log("Pipeline error: ",err)
})
