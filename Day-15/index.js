import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const POLICY_CHUNKS = [
  {
    code: "OPT-25FPS",
    text: "OPT-25FPS carries 9.5% p.a. interest for tenures up to 5 years.",
  },
  {
    code: "OPT-30STD",
    text: "OPT-30STD carries 8.75% p.a. interest for tenures up to 3 years.",
  },
];

function retrieveDocs(query) {
  const hit = POLICY_CHUNKS.find((c) => query.toUpperCase().includes(c.code));
  return hit ? hit.text : "No matching policy found.";
}

function calculateEMI(principal, rate, tenure) {
  const r = rate / 12 / 100; //montly rate
  const n = tenure * 12; // months
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi * 100) / 100;
}


const TOOLS = {
    retrieveDocs:{
        description:'Look up loan policy text by query string. Args: { query: string }',
        run: ({query})=> retrieveDocs(query)
    },
    calculateEMI:{
        description:"Calculate monthly EMI. Args: { principal: number, rate: number, tenure: number }",
        run:({principal,rate,tenure})=>calculateEMI(principal,rate,tenure)
    }
}

const SYSTEM_PROMPT = `You are Loan Agent. You answer loan related questions step by step.

Available tools: ${Object.entries(TOOLS).map(([name,t])=>`-${name}: ${t.description}`).join("\n")}

At each step respond with only a JSON object, no other text:
- To use a tool: {"thought":"...","action":"toolname","actionInput":{...}}
- When you're done: {"thought":"...","finalAnswer":"..."}

one tool call per step. Use the observations you have already gathered before calling a tool again.
`

async function runAgent(question,maxSteps=5){
    const messages=[
        {role:"system",content:SYSTEM_PROMPT},
        {role:"user",content:question}
    ]

    for(let step=1;step<=maxSteps;step++){
        const response = await groq.chat.completions.create({
            model:'openai/gpt-oss-120b',
            messages,
            response_format:{type:"json_object"}
        })

        const raw = response.choices[0].message.content;
        const parsed = JSON.parse(raw);

        console.log(`STEP: ${step}`);
        console.log(`Thought: ${parsed.thought}`)

        if(parsed.finalAnswer){
            console.log(`Final Answer: ${parsed.finalAnswer}`)
            return parsed.finalAnswer;
        }

        const tool = TOOLS[parsed.action];
        if(!tool){
            messages.push({role:"assistant",content:raw});
            messages.push({role:"user",content:`Error: no tool named "${parsed.action}". Try again.`});
            continue;
        }

        const observation = tool.run(parsed.actionInput);
        console.log("Action: ",parsed.action,parsed.actionInput);
        console.log("Observation: ",observation);

        messages.push({role:"assistant",content:raw});
        messages.push({role:"user",content:`Observation: ${observation}`});

    }
    return "Agent did not finish within maxSteps";
}

const question =
  "What's the monthly EMI for a ₹500000 loan under policy OPT-25FPS over 3 years?";

runAgent(question)