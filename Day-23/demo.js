// demo.js — fire some queries (with repeats) so the cache + logging have something to show.
import fs from "node:fs";
import { answerQuery } from "./pipeline.js";
import { cacheStats } from "./cache.js";
import { LOG_FILE } from "./llm.js";

fs.rmSync(LOG_FILE, { force: true }); // fresh log = clean numbers

const queries = [
  "What is the minimum CIBIL score for a home loan?",
  "Are there prepayment charges?",
  "Which documents do I need to apply?",
  "Hi there!",
  "What is the minimum CIBIL score for a home loan?",   // repeat -> cache hit
  "  what is the minimum cibil score for a home loan? ", // normalized repeat -> cache hit
  "Are there prepayment charges?",                       // repeat -> cache hit
  "What is the processing fee?",
];

for (const q of queries) {
  const r = await answerQuery(q);
  console.log(
    `${r.cached ? "HIT " : "MISS"} | ${r.intent.padEnd(15)} | $${r.cost.toFixed(6)} | ${String(r.latencyMs).padStart(5)}ms | ${q.trim()}`
  );
}

console.log("\nCache:", cacheStats());
console.log("Now run: node report.js");