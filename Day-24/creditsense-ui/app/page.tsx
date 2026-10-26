"use client";

import { useRef, useState, useEffect } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  // 1. Initialize the ref as null or empty string
  const threadId = useRef<string>(""); 

  // 2. Generate the ID only when the component mounts in the browser
  useEffect(() => {
    if (!threadId.current) {
      threadId.current = crypto.randomUUID();
    }
  }, []);
  // const threadId = useRef(crypto.randomUUID()); // same thread = agent keeps memory

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);
    // add the user message + an empty assistant message we will fill token by token
    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "assistant", text: "" },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, threadId: threadId.current }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // a chunk can hold half a frame or several frames, so split on blank lines
      const frames = buffer.split("\n\n");
      buffer = frames.pop()!; // last piece may be incomplete, keep it

      for (const frame of frames) {
        const event = frame.match(/^event: (.*)$/m)?.[1];
        const data = JSON.parse(frame.match(/^data: (.*)$/m)?.[1] ?? "{}");

        if (event === "status") setStatus(data.text);

        if (event === "token") {
          setStatus("");
          // append token to the last (assistant) message
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              text: copy[copy.length - 1].text + data.text,
            };
            return copy;
          });
        }

        if (event === "error") {
          setStatus("");
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              text: `Error: ${data.message}`,
            };
            return copy;
          });
        }
      }
    }

    setStatus("");
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 className="text-7xl text-white bg-amber-700 rounded-2xl p-5">CreditSense</h1>

      <div style={{ minHeight: 300 }}>
        {messages.map((m, i) => (
          <p key={i} style={{ whiteSpace: "pre-wrap" }}>
            <b>{m.role === "user" ? "You" : "CreditSense"}:</b> {m.text}
          </p>
        ))}
        {status && <p style={{ color: "gray" }}>{status}</p>}
      </div>
      <div className="flex items-center justify-between gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Ask about loan policy..."
        style={{ width: "80%", padding: 8 }}
        className="border-[0.5px] rounded-xl w-3/4"
      />
      <button className="bg-green-900 rounded-xl p-4 w-1/4 cursor-pointer hover:bg-green-950" onClick={handleSend} disabled={loading} style={{ padding: 8 }}>
        {loading ? "..." : "Send"}
      </button>
      </div>
    </main>
  );
}