import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const askZenBot = createServerFn({ method: "POST" })
  .inputValidator((d: { question: string }) =>
    z.object({ question: z.string().trim().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: faqs } = await supabase.from("chatbot_faqs").select("*");
    const q = data.question.toLowerCase();
    // 1) keyword match
    let best: { answer: string; score: number } | null = null;
    for (const f of faqs ?? []) {
      const kws = (f.keywords ?? []) as string[];
      const score = kws.reduce((n, k) => (q.includes(k.toLowerCase()) ? n + 1 : n), 0);
      if (score > 0 && (!best || score > best.score)) best = { answer: f.answer, score };
    }
    if (best) return { answer: best.answer, source: "faq" as const };

    // 2) fallback → Lovable AI Gateway
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        answer:
          "I'm not sure yet — try asking about tickets, timings, food, lockers, transport or Zenzyy Cash. Our team is happy to help at the park too!",
        source: "fallback" as const,
      };
    }
    const faqContext = (faqs ?? [])
      .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are ZenBot, the friendly assistant for Zenzyy Water Park (Chitrakoot, India). Answer briefly (2-3 sentences), warmly, using only the FAQ context below. If it's not in the FAQ, politely say you'll pass the question to the park team. Prices in ₹.\n\nFAQ:\n${faqContext}`,
            },
            { role: "user", content: data.question },
          ],
        }),
      });
      if (!res.ok) throw new Error(`ai ${res.status}`);
      const json = (await res.json()) as any;
      const answer =
        json?.choices?.[0]?.message?.content?.trim() ??
        "I'll pass that to our team — please try again in a moment.";
      return { answer, source: "ai" as const };
    } catch {
      return {
        answer:
          "I couldn't reach the assistant right now. Try asking about tickets, timings, food, lockers or transport — or contact us on WhatsApp.",
        source: "fallback" as const,
      };
    }
  });