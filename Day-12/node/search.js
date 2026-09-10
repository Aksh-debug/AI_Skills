import 'dotenv/config';
import { CohereClient } from 'cohere-ai';
import pool from './db.js';

const cohere=new CohereClient({
    token:process.env.COHERE_API_KEY
})

async function vectorSearch(queryEmbedding,limit=20){
    const results=await pool.query(`
        SELECT id,title,content,embedding <=> $1::vector AS distance
        FROM info_docs
        ORDER BY distance ASC
        LIMIT $2
        `,[JSON.stringify(queryEmbedding),limit]);
    return results.rows.map((row,index)=>({
        id:row.id,
        content:row.content,
        rank:row.index
    }))
}

async function keywordSearch(query,limit=20){
    const results = await pool.query(`
        SELECT id,title,content,ts_rank(content_tsv,plainto_tsquery('english',$1)) AS score
        FROM info_docs
        ORDER BY score DESC
        LIMIT $2
        `,[query,limit]);
    return results.rows.map((row,index)=>({
        id:row.id,
        content:row.content,
        rank:row.index
    }))
};

function reciprocalRankFusion(vectorResults,keywordResults,k=60){
    const scores = new Map();
    for(const {id,content,rank} of vectorResults){
        const rrf = 1 / (k+rank+1);
        scores.set(id,{content,score:(scores.get(id)?.score || 0) + rrf})
    }  
    for(const {id,content,rank} of keywordResults){
        const rrf=1/(k+rank+1);
        scores.set(id,{content,score:(scores.get(id)?.score || 0) + rrf})
    }
    return [...scores.entries()]
    .map(([id, { content, score }]) => ({ id, content, score }))
    .sort((a, b) => b.score - a.score);
}


async function hybridSearch(query,queryEmbedding,topK=20){
    const [vectorSearchResults,keywordSearchResults] = await Promise.all([vectorSearch(queryEmbedding,20),keywordSearch(query,20)])
    console.log(vectorSearchResults.length,keywordSearchResults.length)
    const merged=reciprocalRankFusion(vectorSearchResults,keywordSearchResults);
    return merged.slice(0,topK);
}

export {hybridSearch};