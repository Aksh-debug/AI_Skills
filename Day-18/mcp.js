import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from "zod";
import { runPipeLine } from "./index.js";

const server = new McpServer({
    name:"sportsDocs-mcp",
    version:"1.0.0"
});

server.tool(
    "search_docs",
    "Authoritative internal knowledge base for sports science and training protocols. ALWAYS use this tool first for any question about specific protocols, reference codes, or technical details in this domain — this is the only source with accurate internal codes and standards, which are NOT available via general web search.",
    {query: z.string()},
    async ({query})=>{
        const results = await runPipeLine(query);
        return {
            content:[{type:"text",text:JSON.stringify(results)}]
        }
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
await runPipeLine("Athletes not knowing each other")