// compareIntent.js — same labeled questions through 70B vs 8B: accuracy, cost, latency.
import { classifyIntent } from "./intent.js";
import { MODELS } from "./llm.js";

const tests = [
  { q: "What is the minimum CIBIL score for a home loan?", expected: "policy_question" },
  { q: "Are there prepayment charges on floating rate loans?", expected: "policy_question" },
  { q: "What's the processing fee for a personal loan?", expected: "policy_question" },
  { q: "Who is eligible for a top-up loan?", expected: "policy_question" },
  { q: "Calculate EMI for 20 lakh at 9% for 15 years", expected: "emi_calculation" },
  { q: "What will my monthly payment be on a 5 lakh loan for 3 years?", expected: "emi_calculation" },
  { q: "How much total interest will I pay on 10 lakh at 8.5% over 10 years?", expected: "emi_calculation" },
  { q: "Which documents do I need to apply?", expected: "document_check" },
  { q: "I uploaded my PAN and Aadhaar, is anything missing?", expected: "document_check" },
  { q: "Do I need salary slips for a home loan?", expected: "document_check" },
  { q: "Hi there!", expected: "other" },
  { q: "Thanks, that was helpful", expected: "other" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); // be gentle with rate limits

async function runModel(model) {
  let correct = 0, totalCost = 0, totalLatency = 0;
  const wrong = [];

  for (const [i, t] of tests.entries()) {
    // "cmp-" prefix keeps these calls out of the real $-per-100-requests report
    const r = await classifyIntent(t.q, `cmp-${model}-${i}`, model);
    totalCost += r.cost;
    totalLatency += r.latencyMs;
    if (r.intent === t.expected) correct++;
    else wrong.push(`"${t.q}" -> ${r.intent} (expected ${t.expected})`);
    await sleep(300);
  }

  return {
    model,
    accuracy: `${correct}/${tests.length}`,
    costPer1000: `$${((totalCost / tests.length) * 1000).toFixed(4)}`,
    avgLatencyMs: Math.round(totalLatency / tests.length),
    wrong,
  };
}

const results = [await runModel(MODELS.big), await runModel(MODELS.small)];

console.table(results.map(({ wrong, ...row }) => row));
for (const r of results) {
  if (r.wrong.length) console.log(`\nMisses for ${r.model}:\n- ${r.wrong.join("\n- ")}`);
}