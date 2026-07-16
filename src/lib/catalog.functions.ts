import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listZones = createServerFn({ method: "GET" })
  .inputValidator((d: { parkId: string }) => z.object({ parkId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: rows, error } = await pub()
      .from("park_zones")
      .select("*")
      .eq("park_id", data.parkId);
    if (error) return { zones: [] };
    return { zones: rows ?? [] };
  });

export const listTiers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub()
    .from("ticket_tiers")
    .select("*")
    .eq("active", true);
  if (error) return { tiers: [] };
  return { tiers: data ?? [] };
});

export const listTransport = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub()
    .from("transport_options")
    .select("*")
    .eq("active", true);
  if (error) return { options: [] };
  return { options: data ?? [] };
});

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await pub()
    .from("chatbot_faqs")
    .select("*")
    .order("sort_order");
  return { faqs: data ?? [] };
});