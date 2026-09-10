import pkg from "pg";
import "dotenv/config";
import pool from "./db.js";

async function vectorSearch(queryEmbedding, limit = 20) {
  const results = await pool.query(
    `SELECT id,title,content,embedding <=> $1::vector AS distance
        FROM info_docs
        ORDER BY distance ASC
        LIMIT $2
        `,
    [JSON.stringify(queryEmbedding), limit],
  );
  return results.rows.map((row, index) => ({
    id: row.id,
    content: row.content,
    rank: index,
  }));
}

async function keywordSearch(queryText, limit = 20) {
  const results = await pool.query(
    `SELECT id,title,content, ts_rank(content_tsv,plainto_tsquery('english',$1)) AS score
        FROM info_docs
        WHERE content_tsv @@ plainto_tsquery('english',$1)
        ORDER BY score DESC
        LIMIT $2
        `,
    [queryText, limit],
  );
  return results.rows.map((row, index) => ({
    id: row.id,
    content: row.content,
    rank: index,
  }));
}

function reciprocalRankFusion(vectorResults, keywordResults, k = 60) {
  const scores = new Map();
  for (const { id, content, rank } of vectorResults) {
    const rrf = 1 / (k + rank + 1); // +1 as rank starts with 0
    scores.set(id, { content, score: (scores.get(id)?.score || 0) + rrf });
  }

  for (const { id, content, rank } of keywordResults) {
    const rrf = 1 / (k + rank + 1);
    scores.set(id, { content, score: (scores.get(id)?.score || 0) + rrf });
  }

  return [...scores.entries()]
    .map(([id, { content, score }]) => ({ id, content, score }))
    .sort((a, b) => b.score - a.score);
}

async function hybridSearch(queryText, queryEmbedding, topK = 5) {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(queryEmbedding, 20),
    keywordSearch(queryText, 20),
  ]);
  const merged = reciprocalRankFusion(vectorResults, keywordResults);
  return merged.slice(0, topK);
}

export { hybridSearch, vectorSearch, keywordSearch };
