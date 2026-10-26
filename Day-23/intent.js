// intent.js — the "easy step": classify the user's message. Model is a parameter so we can swap it.
import { callLLM, MODELS } from "./llm.js";

export const INTENTS = ["policy_question", "emi_calculation", "document_check", "other"];

const INSTRUCTIONS = `Classify the loan-assistant user message below into exactly one label:
- policy_question: asks about loan rules, eligibility, interest rates, fees, or policy text
- emi_calculation: asks to calculate an EMI, monthly payment, or total interest
- document_check: asks which documents are needed, or whether documents are missing
- other: greetings, small talk, anything else
Reply with ONLY the label, nothing else.`;

export async function classifyIntent(query, requestId, model = MODELS.small) {
  const r = await callLLM({
    requestId,
    step: "classify",
    model,
    maxTokens: 300, // room for a little thinking + the ~3-token label
    messages: [{ role: "user", content: `${INSTRUCTIONS}\n\nMessage: ${query}` }],
  });

  const label = r.text.toLowerCase().replace(/[^a-z_]/g, "");

  if (!INTENTS.includes(label)) {
    // Don't hide this: a bad label silently becoming "other" is exactly what caused the empty-cache bug
    console.warn(`[warn] unexpected label "${r.text}" for query: ${query}`);
  }

  const intent = INTENTS.includes(label) ? label : "other";
  return { intent, cost: r.cost, latencyMs: r.latencyMs };
}