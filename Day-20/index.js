import Groq from "groq-sdk";
import "dotenv/config";
import { Annotation, StateGraph, START, END, interrupt, MemorySaver, Command } from "@langchain/langgraph";
import {z} from "zod";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in .env");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const submitSchema=z.object({
    policyId:z.enum(["OPT-25FPS", "OPT-30HL", "OPT-10CL"]),
    principal:z.number().positive().max(10_000_000),
    months:z.number().int().positive().max(240)
})

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
  confidence: Annotation({ reducer:(a,b)=>b??a ,default: () => 1 }),
  nextAction: Annotation(),
  answer: Annotation(),
  status:Annotation()
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
 const systemPrompt = `You are a routing agent. Decide the single next action given the question and scratchpad so far.
    Return only raw JSON, no markdown, no explanation: {"action":"retrieve"|"calculate_emi"|"flag_missing_docs"|"final_answer","args":{...}}
    - "retrieve": args = { "query": string } — returns ONLY interest rate, tenure limit, and min credit score for a policy. It never returns document requirements — do not call it for document questions.
    - "calculate_emi": args = { "principal": number, "rate": number, "months": number } — use once you have the policy's rate from a prior "retrieve" step
    - "flag_missing_docs": args = { "policyId": string, "providedDocs": string[] } — the ONLY way to check required documents. Use this whenever the question mentions documents submitted or missing, using the policy ID directly — no need to "retrieve" first.
    - "final_answer": args = { "text": string } — use once you have enough info to answer
    - "submit_application": args = { "policyId": string, "principal": number, "months": number } — ONLY use when the user explicitly asks to submit or apply. Never use it just to answer a question.

    Question: ${state.question}
    Scratchpad so far: ${JSON.stringify(state.scratchpad)}
    `;
  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0,
  });
  console.log(state.question)
  const decision = parseAgentDecision(res.choices[0].message.content);
  console.log(decision)
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

function answerNode(state) {
  return {answer:state.nextAction.args.text}
}

function clarifyNode() {
  return {
    answer:
      "I couldn't find a confident match for that policy. Could you specify the loan type or policy code (e.g. OPT-25FPS)?",
  };
}

function submitApplication({ policyId, principal, months }) {
  return `Application submitted: ${policyId}, ₹${principal}, ${months} months`;
}

function confirmNode(state){
    const parsed=submitSchema.safeParse(state.nextAction.args);
    if(!parsed.success){
        const why = parsed.error.issues.map((i)=>i.message).join("; ");
        return { scratchpad: [`submit_application -> REJECTED, invalid args: ${why}`] };
    }
    const approved = interrupt({
        message:"About to submit this application. Confirm?",
        details:parsed.data
    })

    if (!approved) {
    return { scratchpad: ["submit_application -> user DECLINED, nothing was submitted"] };
    }
    return { scratchpad: [`submit_application -> ${submitApplication(parsed.data)}`] };
}

// ---- Routing: ONE conditional edge, three outcomes ----

function routeAfterAgent(state) {
  const { action } = state.nextAction;
  if (action === "submit_application") return "confirm";   // write actions never go to "tools"
  if (action !== "final_answer") return "tools";
  return state.confidence < 0.5 ? "clarify" : "generate_answer";
}

const graph = new StateGraph(RootState)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addNode("generate_answer", answerNode)
  .addNode("clarify", clarifyNode)
  .addNode("confirm", confirmNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", routeAfterAgent, {
    tools: "tools",
    confirm: "confirm",
    generate_answer: "generate_answer",
    clarify: "clarify",
  })
  .addEdge("tools", "agent")
  .addEdge("confirm", "agent")
  .addEdge("generate_answer",END)
  .addEdge("clarify", END)
  .compile({ checkpointer: new MemorySaver() });

// ---- Run ----

async function main() {
//   const question =
//     "I want a 500000 loan under OPT-25FPS over 60 months. I've submitted PAN and Aadhaar — what's my EMI, am I missing anything? If it looks fine, submit the application.";

  const question =
  "I want a 500000 loan under OPT-25FPS over 60 months. I've submitted PAN, Aadhaar, salary_slip and bank_statement. Check my EMI and documents, and if everything looks fine, submit the application.";

  const config = { configurable: { thread_id: "run-1" }, recursionLimit: 25 };
  const rl = readline.createInterface({ input: stdin, output: stdout });

  let result = await graph.invoke({ question }, config);

  // Keep resuming as long as the graph is paused waiting for a human
  while (result.__interrupt__?.length) {
    const req = result.__interrupt__[0].value;
    console.log("\n⚠️ ", req.message, req.details);
    const reply = await rl.question("Type 'yes' to approve: ");
    result = await graph.invoke(
      new Command({ resume: reply.trim().toLowerCase() === "yes" }),
      config
    );
  }
  rl.close();

  console.log("\nScratchpad trace:");
  result.scratchpad.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log("\nFinal answer:", result.answer);
}

main()