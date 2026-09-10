import { CohereClient } from "cohere-ai";
import "dotenv/config";
import pool from "./db.js";
import { docs, formattedDocument } from "./docs.js";
import {toSql} from 'pgvector';
import { hybridSearch, keywordSearch, vectorSearch } from "./search.js";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

async function embedTexts(texts,inputType){
    const response = await cohere.embed({
        model:'embed-english-v3.0',
        texts,
        inputType
    })
    return response.embeddings;
}

async function storeEmbeddings(embeddings){
    try {
        await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await pool.query(`CREATE TABLE IF NOT EXISTS info_docs(
            id SERIAL PRIMARY KEY,
            title TEXT,
            content TEXT,
            embedding vector(1024),
            content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
            )`);
        // await pool.query(`ALTER TABLE info_docs ADD COLUMN content_tsv TSVECTOR
        //     GENERATED ALWAYS AS (to_tsvector('english',content)) STORED`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_info_docs_tsv ON info_docs USING GIN(content_tsv)`);
        
        const insertQuery = `INSERT INTO info_docs (title,content,embedding) VALUES ($1,$2,$3)`;
        for(let i=0;i<docs.length;i++){
            const vectorString=toSql(embeddings[i]);
            await pool.query(insertQuery,[docs[i].title,docs[i].content,vectorString])
        }
        console.log('data embedded successfully!!');
    } catch (error) {
        console.error(error)
    }
}


// const formattedDocs = docs.map(({title,content})=>formattedDocument(title,content));
// const docsEmbeddings = await embedTexts(formattedDocs,'search_document')

// await storeEmbeddings(docsEmbeddings)

const query = 'What does OPT-25FPS refer to?';
const queryEmbedding = await embedTexts([query],'search_query');

console.log('--vector search results---');
const vectorSearchResults = await vectorSearch(queryEmbedding[0],5);
vectorSearchResults.forEach(r => console.log(`  ${r.content.slice(0, 80)}...`));

console.log('--hybrid search results--');
const hybridSearchResults = await hybridSearch(query,queryEmbedding[0],5)
hybridSearchResults.forEach(r => console.log(`  [${r.score.toFixed(4)}] ${r.content.slice(0, 80)}...`));

console.log('--- Keyword-only results ---');
const keywordOnly = await keywordSearch("What does OPT-25FPS refer to?", 5);
keywordOnly.forEach(r => console.log(`  ${r.content.slice(0, 80)}...`));

