import { document1,document2,document3,document4,document5,document6 } from './documents.js';
import {db} from './lib/db.js';
import {toSql} from 'pgvector';

const documents=[document1,document2,document3,document4,document5,document6]

import Groq from 'groq-sdk';
import {CohereClient} from 'cohere-ai';
import 'dotenv/config';

const client = await db.connect();
const cohere = new CohereClient({
    token:process.env.COHERE_API_KEY
})

async function embedDocuments(texts){
        const response=await cohere.embed({
            texts,
            model:'embed-english-v3.0',
            inputType:'search_document'
        })
        return response.embeddings;
}

async function storeEmbeddings(embeddings){
    try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector`); // enables the pgvector extension in db
        
        await client.query(`CREATE TABLE IF NOT EXISTS ITEMS (
                id SERIAL PRIMARY KEY,
                document TEXT,
                embedding vector(1024)
            )`)


        const insertQuery=`INSERT INTO ITEMS (document,embedding) VALUES ($1,$2);`;
        for(let i=0;i<documents.length;i++){
            const pgVectorString=toSql(embeddings[i])
            await client.query(insertQuery,[documents[i],pgVectorString])
        }
        console.log('stored embedding successfully')
    } catch (error) {
        console.log(error)
    }
}


async function findNearestNeighbors(query,documents,embeddings,topK=5){
  try {
      const queryResponse=await cohere.embed({
        texts:[query],
        model:'embed-english-v3.0',
        inputType:'search_query'
    });
    const queryEmbedding=queryResponse.embeddings[0];
    const results=await client.query(`
            SELECT id,document,embedding <=> $1 AS distance
            FROM ITEMS
            ORDER BY distance ASC
            LIMIT $2
        `,[toSql(queryEmbedding),topK])
    return results.rows
  } catch (error) {
    console.error(error)
  }
}

const embeddings=await embedDocuments(documents)
await storeEmbeddings(embeddings)
const userQuery='My age is 25, am I eligible?'
const results=await findNearestNeighbors(userQuery,documents,embeddings,2)
console.log(results)
await db.end()
