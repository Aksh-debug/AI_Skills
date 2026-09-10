import {CohereClient} from "cohere-ai";
import { chunkAllDocs, fixedChunk, recursiveChunking, semanticChunk } from "./chunkers.js";
import { docs, queries } from "./docs.js";
import 'dotenv/config';


const cohere = new CohereClient({
    token:process.env.COHERE_API_KEY
})


function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedTexts(texts,inputType){

    const response = await cohere.embed({
        texts,
        inputType,
        model:'embed-english-v3.0',
        embeddingTypes:["float"]
    })
    return response.embeddings.float;
}


function findBestChunk(queryEmbedding,chunksWithEmbedding){
    let best=null;
    let bestScore=-1
    for(const chunk of chunksWithEmbedding){
        const score=cosineSimilarity(queryEmbedding,chunk.embedding)
        if(score>bestScore){
            bestScore=score
            best=chunk
        }
    }
    return {chunk:best,score:bestScore}
}


async function main(){
    const strategies={
        fixed:fixedChunk,
        recursive:recursiveChunking,
        semantic:semanticChunk
    }

    // Step 1: chunk the docs 3 ways, and embed each set of chunks
    const chunkedIndexes={};

    for(const [name,chunkerFn] of Object.entries(strategies)){
        const chunks=chunkAllDocs(docs,chunkerFn);
        const texts=chunks.map(c=>c.text);
        const embeddings = await embedTexts(texts,'search_document')

        chunks.forEach((chunk,i)=>{chunk.embedding=embeddings[i]}); // storing the embeddings in the chunks object for now, ideally should store in vector db

        chunkedIndexes[name] = chunks;

        console.log(`${name}: ${chunks.length} chunks created"`)
    }   

    // Step 2: embed all 5 test queries in one batch
    const queryTexts=queries.map(q=>q.query);
    const queryEmbeddings=await embedTexts(queryTexts,'search_query');

    console.log('---RESULTS---');
    const scoreboard={fixed:0,semantic:0,recursive:0};

    for(let i=0;i<queries.length;i++){
        const q=queries[i];
        const qEmbedding=queryEmbeddings[i]

        for(const strategyName of Object.keys(strategies)){
            const {chunk,score}=findBestChunk(qEmbedding,chunkedIndexes[strategyName]);
            const correct=chunk.docId===q.expectedDocId;
            if(correct){
                scoreboard[strategyName]++
            }
            const mark=correct ? "correct" : "wrong"
            const preview = chunk.text.slice(0, 100).replace(/\n/g, " ");
 
            console.log(`  [${strategyName}] ${mark} (score: ${score.toFixed(3)}, doc: ${chunk.docId})`);
            console.log(`    "${preview}..."`);
    }
    console.log("") 
    }
    console.log("--- SCOREBOARD (correct top-1 matches out of 5 queries) ---");
    
    for (const [name, count] of Object.entries(scoreboard)) {
        console.log(`${name}: ${count}/5`);
    }
}

main();