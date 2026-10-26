// pipeline.js — cache -> cheap intent step -> retrieval (top 3 only) -> big-model answer.
import { randomUUID } from "node:crypto";
import { callLLM, logEvent, MODELS } from "./llm.js";
import { getCached, setCached } from "./cache.js";
import { classifyIntent } from "./intent.js";
import { retrieveChunks } from "./retrieve.js";

const SYSTEM = `Answer using ONLY the context. If the context does not contain the answer, say "I don't have enough information." Be concise.`;

export async function answerQuery(query) {
  const requestId = randomUUID();
  const start = Date.now();

  // 1) Cache: a hit costs $0 and skips every API call
  const cached = getCached(query);
  if (cached) {
    const latencyMs = Date.now() - start;
    logEvent({ requestId, step: "cache_hit", cost: 0, latencyMs });
    return { ...cached, cached: true, cost: 0, latencyMs };
  }

  // 2) Model tiering: small model for the easy step
  const { intent, cost: intentCost } = await classifyIntent(query, requestId, MODELS.small);

  // Small talk never reaches the big model
  if (intent === "other") {
    const result = { answer: "I can help with loan policies, EMI calculations, and document checks.", intent };
    setCached(query, result); // cache this too, so a repeated greeting skips even the cheap classify call
    return { ...result, cached: false, cost: intentCost, latencyMs: Date.now() - start };
  }

  // 3) Prompt compression: send only the top 3 reranked chunks
  const chunks = (await retrieveChunks(query)).slice(0, 3);
  const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");

  // 4) Big model for the hard step
  const gen = await callLLM({
    requestId,
    step: "generate",
    model: MODELS.big,
    maxTokens: 1000, // covers thinking tokens + the visible answer
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${query}` },
    ],
  });

  const result = { answer: gen.text, intent };
  setCached(query, result);

  return { ...result, cached: false, cost: intentCost + gen.cost, latencyMs: Date.now() - start };
}