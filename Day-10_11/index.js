import "dotenv/config";

import { CohereClient } from "cohere-ai";
import { toSql } from "pgvector";
import pool from "./db.js";
import { docs, formattedDocument } from "./docs.js";
import { hybridSearch } from "./search.js";
import Groq from "groq-sdk";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function embedTexts(texts, inputType) {
  const response = await cohere.embed({
    model: "embed-english-v3.0",
    inputType,
    texts,
  });
  return response.embeddings;
}

async function storeEmbeddings(embeddings) {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await pool.query(`CREATE TABLE IF NOT EXISTS info_docs(
            id SERIAL PRIMARY KEY,
            title TEXT,
            content TEXT,
            embedding vector(1024),
            content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english',content)) STORED
            )`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_info_docs ON info_docs USING GIN(content_tsv)`,
    );

    const insertQuery = `INSERT INTO info_docs (title,content,embedding) VALUES ($1,$2,$3)`;
    for (let i = 0; i < docs.length; i++) {
      const vectorString = toSql(embeddings[i]);
      await pool.query(insertQuery, [
        docs[i].title,
        docs[i].content,
        vectorString,
      ]);
    }
    console.log("data embededd successfully!!");
  } catch (error) {
    console.log(error);
  }
}

async function reRankChunks(query, hybridSearchResults) {
  const documents = hybridSearchResults.map((r) => r.content);

  const reRanked = await cohere.rerank({
    model: "rerank-english-v3.0",
    query,
    documents: documents,
    topN: 5,
  });
  console.log("---ReRank results-----");
  return reRanked.results.map((r) => ({
    ...hybridSearchResults[r.index],
    relevanceScore: r.relevanceScore,
  }));
}

async function generateAnswer(query, top5Chunks,guard=true) {
    
    const CONFIDENCE_THRESHOLD=0.3;
    
    const topScore = top5Chunks[0]?.relevanceScore ?? 0;
    if(guard && topScore<CONFIDENCE_THRESHOLD){
        return {
            answer:"I don't have enought information on the loan policy documents to answer that confidently.Could you rephrase or ask about a topic covered in policy docs?",
            grounded:false,
            topScore
        }
    }


    const context = top5Chunks
        .map((chunk, i) => `[i+1] ${chunk.content}`)
        .join("\n\n");
    const systemPrompt = `You are a helpful assistant that answers questions using ONLY the provided context.
                        If the answer is not in the context, say "I don't have enough information to answer that."
                        Do not use outside knowledge.

                        Context:
                        ${context}`;
     // LLM call
     const completion = await groq.chat.completions.create({
        model:'llama-3.3-70b-versatile',
        messages:[
            {role:"system",content:systemPrompt},
            {role:"user",content:query}
        ],
        temperature:0
     });

    return {
    answer: completion.choices[0].message.content,
    grounded: guard ? true : null,
    topScore
  };

}

// const formattedDocs = docs.map(({title,content})=>formattedDocument(title,content));
// const docsEmbeddings = await embedTexts(formattedDocs,'search_document')

// await storeEmbeddings(docsEmbeddings);

const query = "What do you know about altitude training?";
const queryEmbedding = await embedTexts([query], "search_query");

console.log("--hybrid search results--");
const hybridSearchResults = await hybridSearch(query, queryEmbedding[0], 20);
console.log(hybridSearchResults);
hybridSearchResults.forEach((r) =>
  console.log(`  [${r.score.toFixed(4)}] ${r.content.slice(0, 80)}...`),
);

const top5 = await reRankChunks(query, hybridSearchResults);
console.log(top5);

const withoutRerank = await generateAnswer(query, hybridSearchResults.slice(0,5),false);
console.log("--------LLM Answer without rerank------");
console.log(withoutRerank);

const withReRank = await generateAnswer(query, top5);
console.log("--------LLM Answer with rerank------");
console.log(withReRank);
