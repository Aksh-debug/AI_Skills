// report.js — reads llm-log.jsonl and prints the number you need: $ per 100 requests.
import fs from "node:fs";
import { LOG_FILE, MODELS, calcCost } from "./llm.js";

const events = fs
  .readFileSync(LOG_FILE, "utf8")
  .trim()
  .split("\n")
  .map((l) => JSON.parse(l))
  .filter((e) => !e.requestId.startsWith("cmp-")); // ignore comparison-test calls

// Group log lines by request
const requests = new Map();
const stepCost = {};

for (const e of events) {
  const r = requests.get(e.requestId) ?? { cost: 0, noTiering: 0, latencyMs: 0, cached: false };
  r.cost += e.cost;
  // what this line would have cost if the classify step had used the 70B model
  r.noTiering += e.step === "classify" ? calcCost(MODELS.big, e.inputTokens, e.outputTokens) : e.cost;
  r.latencyMs += e.latencyMs;
  if (e.step === "cache_hit") r.cached = true;
  requests.set(e.requestId, r);

  stepCost[e.step] = (stepCost[e.step] ?? 0) + e.cost;
}

const all = [...requests.values()];
const n = all.length;
const sum = (key) => all.reduce((s, r) => s + r[key], 0);
const hits = all.filter((r) => r.cached).length;

console.log(`Requests: ${n}  |  cache hits: ${hits} (${((hits / n) * 100).toFixed(0)}%)`);
console.log(`Avg latency: ${Math.round(sum("latencyMs") / n)}ms`);
console.log(`\n$ per 100 requests (actual, tiering + cache): $${((sum("cost") / n) * 100).toFixed(4)}`);
console.log(`$ per 100 requests (70B classify instead of 8B): $${((sum("noTiering") / n) * 100).toFixed(4)}`);

console.log("\nCost by step:");
console.table(Object.entries(stepCost).map(([step, cost]) => ({ step, totalUSD: cost.toFixed(6) })));