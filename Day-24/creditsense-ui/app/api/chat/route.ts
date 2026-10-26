import { agent } from "@/lib/agent"; // lib/agent.js (keep it .js)

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // never cache a streaming route

// friendly status text for each tool action
const STATUS: Record<string, string> = {
  retrieve: "Searching policies...",
  calculate_emi: "Calculating EMI...",
  flag_missing_docs: "Checking documents...",
};

export async function POST(req: Request) {
  const { question } = await req.json();

  const encoder = new TextEncoder();

  // SSE frame format:  event: <name>\n data: <json>\n\n
  const send = (
    controller: ReadableStreamDefaultController,
    event: string,
    data: unknown
  ) => {
    controller.enqueue(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const events = agent.streamEvents(
          { question },
          { version: "v2", recursionLimit: 15 }
        );

        for await (const ev of events) {
          // 1. status: when the agent node finishes, we know which tool runs next
          if (ev.event === "on_chain_end" && ev.name === "agent") {
            const action = ev.data?.output?.nextAction?.action;
            if (STATUS[action]) send(controller, "status", { text: STATUS[action] });
          }

          // 2. answer tokens: only from the generate_answer node's LLM call
          if (
            ev.event === "on_chat_model_stream" &&
            ev.metadata?.langgraph_node === "generate_answer"
          ) {
            const token = ev.data?.chunk?.content;
            if (typeof token === "string" && token.length > 0) {
              send(controller, "token", { text: token });
            }
          }

          // 3. clarify node has a fixed message (no LLM), so send it in one go
          if (ev.event === "on_chain_end" && ev.name === "clarify") {
            send(controller, "token", { text: ev.data?.output?.answer ?? "" });
          }
        }

        send(controller, "done", {});
      } catch (err) {
        // headers already sent (200), so report errors as a chunk
        send(controller, "error", {
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // stop nginx-style proxies from buffering
    },
  });
}