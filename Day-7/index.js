import 'dotenv/config';
import { formattedDocument, getFormattedContext, sportsDocuments } from './documents.js';
import {CohereClient} from 'cohere-ai'; 
import { db } from './lib/db.js';
import {toSql} from 'pgvector';
import Groq from 'groq-sdk';

const cohere=new CohereClient({
    token:process.env.COHERE_API_KEY
});

const client = await db.connect();

const groq=new Groq({
    apiKey:process.env.GROQ_API_KEY
})

// 1. embed the document content
// 2. store them in the pg vector
// 3. embed the user query
// 4. find the topK results via similarity search
// 5. now call the LLM with those topK results as context

async function getEmbeddings(documents){
    const response=await cohere.embed({
       model:'embed-english-v3.0',
       texts:documents,
       inputType:'search_document'
    })
    return response.embeddings;
}

async function storeEmbeddings(embeddings){
    try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        await client.query(`CREATE TABLE IF NOT EXISTS DATA(
            id SERIAL PRIMARY KEY,  
            title TEXT,
            content TEXT,
            infoEmbed vector(1024)
            )`)
        const insertQuery=`INSERT INTO DATA (title,content,infoEmbed) VALUES ($1,$2,$3)`;
        for(let i=0;i<sportsDocuments.length;i++){
            const pgVectorString=toSql(embeddings[i]);
            await client.query(insertQuery,[sportsDocuments[i]?.title,sportsDocuments[i]?.content,pgVectorString])
        }
        console.log('data embedded successfully')
    } catch (error) {
        console.error(error)
    }
}

async function similaritySearch(query,topK){
    const queryResponse=await cohere.embed({
        model:'embed-english-v3.0',
        texts:[query],
        inputType:'search_query'
    });
    const queryEmbedding=queryResponse.embeddings[0];

    // perform similarity search using pgvector
    const context = await client.query(`
        SELECT id,title,content,infoEmbed <=> $1 AS distance
        FROM DATA
        ORDER BY distance ASC
        LIMIT $2
        `,[toSql(queryEmbedding),topK])
    console.log(context.rows)
    return context.rows
}

async function callModel(userQuery,context){
    const response=await groq.chat.completions.create({
        model:'llama-3.3-70b-versatile',
        temperature:0,
        messages:[
            {
                "role":"user",
                "content":`User query: ${userQuery}, Context: ${context}`
            }
        ]
    });
    console.log(response.choices[0].message.content)
}

const formattedSportsDocuments=sportsDocuments.map(({title,content})=>formattedDocument(title,content))
const embeddings = await getEmbeddings(formattedSportsDocuments);
await storeEmbeddings(embeddings);

const userQuery='What specific frame rate do optical cameras use to capture spatial data in modern sports analytics?'

const results=await similaritySearch(userQuery,5)
const context=getFormattedContext(results)
await callModel(userQuery,context)
await db.end();