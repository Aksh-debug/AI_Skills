import Groq from "groq-sdk";
import { ChatGroq } from "@langchain/groq"; // CHANGED: LangChain model so token streaming is visible to streamEvents
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
// CHANGED: removed `import "dotenv/config"` (Next.js loads .env.local itself)

let groqClient = null;

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY. Set it in .env.local or your host's environment.");
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

let answerModelInstance = null;

function getAnswerModel() {
  if (!answerModelInstance) {
    answerModelInstance = new ChatGroq({
      model: "openai/gpt-oss-120b",
      temperature: 0,
    });
  }
  return answerModelInstance;
}

// ---- Static data (swap for your Day 9-13 pgvector pipeline later) ----

const POLICY_DOCS = [
  {
    id: "OPT-25FPS",
    text: "OPT-25FPS: Personal loans capped at 15% interest, max tenure 60 months, min credit score 650.",
    rate: 15,
  },
  {
    id: "OPT-30HL",
    text: "OPT-30HL: Home loans capped at 9% interest, max tenure 240 months, min credit score 700.",
    rate: 9,
  },
  {
    id: "OPT-10CL",
    text: "OPT-10CL: Car loans capped at 11% interest, max tenure 84 months, min credit score 620.",
    rate: 11,
  },
];

const REQUIRED_DOCS = {
  "OPT-25FPS": ["PAN", "Aadhaar", "salary_slip", "bank_statement"],
  "OPT-30HL": ["PAN", "Aadhaar", "property_papers", "income_proof"],
  "OPT-10CL": ["PAN", "Aadhaar", "salary_slip", "vehicle_quotation"],
};

// ---- Tool implementations (pure functions, no LLM involved) ----

function retrieveDocs(query) {
  const q = query.toLowerCase();
  const hit = POLICY_DOCS.find((d) => q.includes(d.id.toLowerCase()));
  const confidence = hit ? 0.9 : 0.3;
  return { docs: hit?.text ?? null, confidence };
}

function calculateEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100;
  const emi =
    (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

function checkMissingDocs(policyId, providedDocs) {
  const required = REQUIRED_DOCS[policyId] ?? [];
  return required.filter((d) => !providedDocs.includes(d));
}

// ---- Graph state ----

const RootState = Annotation.Root({
  question: Annotation(),
  scratchpad: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }),
  confidence: Annotation({ reducer: (a, b) => b ?? a, default: () => 1 }),
  nextAction: Annotation(),
  answer: Annotation(),
});

// ---- Helper: LLMs sometimes wrap JSON in ```json fences despite instructions ----

function parseAgentDecision(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Agent returned non-JSON output: ${raw}`);
  }
}

// ---- Nodes ----

async function agentNode(state) {
  // CHANGED: final_answer no longer carries text; the answer node writes (and streams) it
  const systemPrompt = `You are a routing agent. Decide the single next action given the question and scratchpad so far.
    Return only raw JSON, no markdown, no explanation: {"action":"retrieve"|"calculate_emi"|"flag_missing_docs"|"final_answer","args":{...}}
    - "retrieve": args = { "query": string } — returns ONLY interest rate, tenure limit, and min credit score for a policy. It never returns document requirements — do not call it for document questions.
    - "calculate_emi": args = { "principal": number, "rate": number, "months": number } — use once you have the policy's rate from a prior "retrieve" step
    - "flag_missing_docs": args = { "policyId": string, "providedDocs": string[] } — the ONLY way to check required documents. Use this whenever the question mentions documents submitted or missing, using the policy ID directly — no need to "retrieve" first.
    - "final_answer": args = {} — use once the scratchpad has enough info to answer. Do NOT write the answer here.

    Question: ${state.question}
    Scratchpad so far: ${JSON.stringify(state.scratchpad)}
    `;
  const res = await getGroq().chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0,
  });
  const decision = parseAgentDecision(res.choices[0].message.content);
  return { nextAction: decision };
}

function isDuplicate(scratchpad, action, args) {
  const signature = `${action}(${JSON.stringify(args)})`;
  return scratchpad.some((s) => s.startsWith(signature.slice(0, -1)));
}

async function toolsNode(state) {
  const { action, args } = state.nextAction;

  if (action === "retrieve" && isDuplicate(state.scratchpad, "retrieve", args)) {
    return {
      scratchpad: [
        `retrieve("${args.query}") -> already tried this exact query, no new info. Try a different action.`,
      ],
    };
  }

  if (action === "retrieve") {
    const { docs, confidence } = retrieveDocs(args.query);
    return {
      confidence,
      scratchpad: [`retrieve("${args.query}") -> ${docs ?? "no match"}`],
    };
  }

  if (action === "calculate_emi") {
    const emi = calculateEMI(args.principal, args.rate, args.months);
    return {
      scratchpad: [
        `calculate_emi(${args.principal}, ${args.rate}%, ${args.months}mo) -> EMI ₹${emi}`,
      ],
    };
  }

  if (action === "flag_missing_docs") {
    const missing = checkMissingDocs(args.policyId, args.providedDocs);
    return {
      scratchpad: [
        `flag_missing_docs(${args.policyId}, [${args.providedDocs.join(", ")}]) -> missing: ${missing.length ? missing.join(", ") : "none"}`,
      ],
    };
  }

  // Unknown action from the LLM — don't crash the graph, force a retry via scratchpad
  return {
    scratchpad: [`unknown action "${action}" — retry with a valid action`],
  };
}

// CHANGED: a real LLM call that writes the final answer from the scratchpad.
// This is the call whose tokens get streamed to the browser.
// const answerModel = new ChatGroq({
//   model: "openai/gpt-oss-120b",
//   temperature: 0,
// });

async function answerNode(state, config) {
  const res = await getAnswerModel().invoke(
    [
      [
        "system",
        "You are a loan policy assistant. Answer the user's question using ONLY the scratchpad results provided. Be concise and clear. Amounts are in INR (₹).",
      ],
      [
        "human",
        `Question: ${state.question}\n\nScratchpad:\n${state.scratchpad.join("\n")}`,
      ],
    ],
    config // CHANGED: forwarding config is what lets streamEvents see the tokens
  );
  return { answer: res.content };
}

function clarifyNode() {
  return {
    answer:
      "I couldn't find a confident match for that policy. Could you specify the loan type or policy code (e.g. OPT-25FPS)?",
  };
}

// ---- Routing: ONE conditional edge, three outcomes ----

function routeAfterAgent(state) {
  if (state.nextAction.action !== "final_answer") return "tools";
  return state.confidence < 0.5 ? "clarify" : "generate_answer";
}

// CHANGED: exported as `agent`; no checkpointer (this agent is single-turn by design)
export const agent = new StateGraph(RootState)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addNode("generate_answer", answerNode)
  .addNode("clarify", clarifyNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeAfterAgent, {
    tools: "tools",
    generate_answer: "generate_answer",
    clarify: "clarify",
  })
  .addEdge("tools", "agent")
  .addEdge("generate_answer", END)
  .addEdge("clarify", END)
  .compile();

// CHANGED: removed main() — the API route is the entry point now