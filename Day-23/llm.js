// llm.js — one wrapper for every Groq call: runs it, measures tokens/cost/latency, logs it.
import Groq from "groq-sdk";
import fs from "node:fs";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Llama 3.3 70B / Llama 3.1 8B were retired by Groq on 16 Aug 2026.
// Replacements recommended by Groq's deprecations page: gpt-oss-120b / gpt-oss-20b.
export const MODELS = {
  big: "openai/gpt-oss-120b",
  small: "openai/gpt-oss-20b",
};

// USD per 1M tokens. Third-party trackers disagree slightly on Groq's current gpt-oss rates,
// so CHECK groq.com/pricing before you quote a number.
export const PRICES = {
  "openai/gpt-oss-120b": { input: 0.15, output: 0.6 },
  "openai/gpt-oss-20b": { input: 0.075, output: 0.3 },
};

export const LOG_FILE = "llm-log.jsonl";

export function calcCost(model, inputTokens, outputTokens) {
  const p = PRICES[model];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export function logEvent(event) {
  const line = { ts: new Date().toISOString(), ...event };
  fs.appendFileSync(LOG_FILE, JSON.stringify(line) + "\n");
}

export async function callLLM({
  requestId,
  step,
  model,
  messages,
  maxTokens = 1000,
  reasoningEffort = "low", // gpt-oss "thinks" first; low = fewer thinking tokens = cheaper + faster
}) {
  const start = Date.now();

  const res = await groq.chat.completions.create({
    model,
    messages,
    // For reasoning models this limit covers thinking tokens + visible answer,
    // so it must be generous or the visible answer comes back empty.
    max_completion_tokens: maxTokens,
    reasoning_effort: reasoningEffort,
    include_reasoning: false, // don't send the thinking text back to us
    temperature: 0,
  });

  const latencyMs = Date.now() - start;
  const inputTokens = res.usage.prompt_tokens;
  const outputTokens = res.usage.completion_tokens; // includes thinking tokens (you pay for them)
  const cost = calcCost(model, inputTokens, outputTokens);
  const text = (res.choices[0].message.content ?? "").trim();

  if (!text) {
    console.warn(
      `[warn] empty reply from ${model} at step "${step}" (finish_reason: ${res.choices[0].finish_reason}, output tokens: ${outputTokens}). Raise maxTokens.`
    );
  }

  logEvent({ requestId, step, model, inputTokens, outputTokens, cost, latencyMs });

  return { text, cost, latencyMs, inputTokens, outputTokens };
}