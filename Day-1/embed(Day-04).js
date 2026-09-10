import { CohereClient } from "cohere-ai";
import Groq from "groq-sdk";
import 'dotenv/config';


const client= new Groq({
    apiKey:process.env.GROQ_API_KEY
});

const cohere = new CohereClient({
    token:process.env.COHERE_API_KEY
});

const sentences = [
  "The applicant's credit score is below the minimum threshold.",
  "Loan approval requires verified proof of income.",
  "The borrower defaulted on their previous EMI payments.",
  "Interest rates on personal loans have increased this quarter.",
  "The bank rejected the application due to insufficient collateral.",
  "A car is a common mode of personal transportation.",
  "The vehicle needs an oil change every 5000 kilometers.",
  "She drove her new sedan to work this morning.",
  "The chef prepared a spicy curry for dinner.",
  "Fresh vegetables are essential for a healthy diet.",
  "The recipe calls for two cups of basmati rice.",
  "Mount Everest is the tallest mountain in the world.",
  "The hikers reached the summit just before sunset.",
  "Snowfall is common in the Himalayas during winter.",
  "The processing fee for this loan is one percent.",
  "Late payments will incur an additional penalty charge.",
  "The underwriter reviewed the applicant's bank statements.",
  "Electric vehicles are becoming more popular in India.",
  "The stock market rallied after the interest rate announcement.",
  "Mutual funds are a common long-term investment vehicle.",
];

async function getEmbeddings(texts){
    const response=await cohere.embed({
        texts,
        model:'embed-english-v3.0',
        inputType:'search_document'
    })
    return response.embeddings;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findNearestNeighbors(query,texts,embeddings,topK=5){
    const queryResponse=await cohere.embed({
        model:'embed-english-v3.0',
        texts:[query],
        inputType:'search_query'
    })
    const queryEmbedding=queryResponse.embeddings[0];
    const scored=texts.map((text,i)=>({
        text,
        score:cosineSimilarity(queryEmbedding,embeddings[i])
    }))
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,topK);
}

async function main(){
    console.log('Embedding 20 sentences...');
    const embeddings=await getEmbeddings(sentences);
    console.log(`Got ${embeddings.length} embeddings`);
    const query="What are the documents needed by a borrower for loan approval?"
    console.log('Query:',query);
    const results=await findNearestNeighbors(query,sentences,embeddings,5);
    results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.score.toFixed(4)}] ${r.text}`);
  });
}

main().catch(console.error)