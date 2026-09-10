import Groq from "groq-sdk";
import "dotenv/config";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const POLICY_DOCS = [
  {
    id: "OPT-25FPS",
    text: "OPT-25FPS: Personal loans capped at 15% interest, max tenure 60 months, min credit score 650.",
  },
  {
    id: "OPT-30HL",
    text: "OPT-30HL: Home loans capped at 9% interest, max tenure 240 months, min credit score 700.",
  },
  {
    id: "OPT-10CL",
    text: "OPT-10CL: Car loans capped at 11% interest, max tenure 84 months, min credit score 620.",
  },
];

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

const RootState = Annotation.Root({
  question: Annotation(),
  scratchpad: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }),
  confidence: Annotation({ default: () => 1 }),
  nextAction: Annotation(),
  answer: Annotation(),
});

async function agentNode(state) {
  const systemPrompt = `You are routing agent. Decide the single next action given the question and scratchpad so far.
    Return only raw JSON, no markdown, no explanation : {"action":"retrieve"|"calculate_emi"|"final_answer","args":{...}}
    - "retrieve": args = { "query": string } — look up a policy doc
    - "calculate_emi": args = { "principal": number, "rate": number, "months": number } — use once you have the policy's rate/tenure
    - "final_answer": args = { "text": string } — use once you have enough info to answer
 
    Question: ${state.question}
    Scratchpad so far: ${JSON.stringify(state.scratchpad)}
    `;

  const res = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0,
  });

  const decision = JSON.parse(res.choices[0].message.content);
  return { nextAction: decision };
}

async function toolsNode(state) {
  const { action, args } = state.nextAction;
  if (action == "retrieve") {
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
  return {};
}

function answerNode(state) {
  return { answer: state.nextAction.args.text };
}

function clarifyNode() {
  return {
    answer:
      "I couldn't find a confident match for that policy. Could you specify the loan type or policy code (e.g. OPT-25FPS)?",
  };
}

// ---- Routing: ONE conditional edge, three outcomes ----
// - agent still has work to do -> tools
// - agent is ready to answer AND retrieval confidence was high -> answer
// - agent is ready to answer BUT retrieval confidence was low -> clarify

function routeAfterAgent(state) {
  if (state.nextAction.action !== "final_answer") return "tools";
  return state.confidence < 0.5 ? "clarify" : "generate_answer";
}

const graph = new StateGraph(RootState)
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

async function main() {
  const question =
    "What's the max tenure and EMI for a 500000 loan under OPT-25FPS?";

  const result = await graph.invoke(
    { question },
    { recursionLimit: 8 }, // Day 15's maxSteps safety valve, enforced by the framework
  );

  console.log("Question:", question);
  console.log("\nScratchpad trace:");
  result.scratchpad.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
  console.log("\nFinal answer:", result.answer);
}

main().catch(console.error);
