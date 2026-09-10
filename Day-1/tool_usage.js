import Groq from 'groq-sdk';
import 'dotenv/config';

function calculateEmi(principal, annualRatePercent, tenureMonths) {
  const monthlyRate = annualRatePercent / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

const client=new Groq({
    apiKey:process.env.GROQ_API_KEY
});


// define tools

const tools=[
    {
        type:"function",
        function:{
            name:'calculate_emi',
            descrition:'Calculate the monthly emi for a loan, given principal amount, tenure in months and annual interest rate.',
            parameters:{
                type:"object",
                properties:{
                    principal:{ type:"number", description:"Loan amount in INR"},
                    tenure:{type:"number",description:"Loan tenure in months"},
                    interest_rate:{type:"number",description:"Annual interest rate, e.g. 10.4"}
                },
                required:['principal','tenure','interest_rate']
            }
        }
    }
];

const messages=[
    {
        role:'user',
        content:'what would be emi for ₹5,00,000 loan at 5% for 3 years?'
    }
]

// model will use the tools as per the need 
const response = await client.chat.completions.create({
    model:'llama-3.3-70b-versatile',
    messages,
    tools
})

const toolCall=response.choices[0].message.tool_calls[0];
const args=JSON.parse(toolCall.function.arguments);

// based on the tool call, we will get the required arguments from the user prompt 
// and will them to the actual function containing the logic

const result=calculateEmi(args.principal,args.interest_rate,args.tenure);


// adding the tool call and tool call results to the messages

messages.push(response.choices[0].message)
messages.push(
    {
        role:'tool',
        tool_call_id:toolCall.id,
        content:JSON.stringify({emi:result})
    }
)

// send the result back to the user

const final=await client.chat.completions.create({
    model:'llama-3.3-70b-versatile',
    messages,
    tools
})

console.log(final.choices[0].message)