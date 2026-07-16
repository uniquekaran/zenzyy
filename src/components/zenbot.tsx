import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askZenBot } from "@/lib/chatbot.functions";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "bot"; text: string };

const STARTERS = [
  "What are the park timings?",
  "Ticket price for children?",
  "Are outside foods allowed?",
  "Do you offer transport?",
];

export function ZenBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Hi! I'm ZenBot 🤖 — your Zenzyy guide. Ask me anything about tickets, timings, food, transport or Zenzyy Cash." },
  ]);
  const [loading, setLoading] = useState(false);
  const askFn = useServerFn(askZenBot);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  async function send(q: string) {
    const text = q.trim();
    if (!text || loading) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const r = await askFn({ data: { question: text } });
      setMsgs((m) => [...m, { role: "bot", text: r.answer }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "Sorry, I hit a snag. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-2xl hover:scale-105 transition-transform"
          style={{ background: "var(--gradient-aqua)" }}
          aria-label="Open ZenBot"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-semibold">ZenBot</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between p-4 text-white" style={{ background: "var(--gradient-aqua)" }}>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">ZenBot</p>
                <p className="text-[11px] opacity-80">Your Zenzyy assistant</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-white/20" aria-label="Close ZenBot">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 max-h-[50vh] overflow-y-auto p-3 space-y-2 bg-secondary/20">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm",
                )}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>
          {msgs.length <= 1 && (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] rounded-full border border-border px-2.5 py-1 hover:bg-secondary transition"
                >{s}</button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-2 flex items-center gap-2 border-t border-border bg-background"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              maxLength={500}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-9 w-9 rounded-full text-white flex items-center justify-center disabled:opacity-50"
              style={{ background: "var(--gradient-aqua)" }}
              aria-label="Send"
            ><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}