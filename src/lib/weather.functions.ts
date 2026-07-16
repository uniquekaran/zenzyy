import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((d: { parkId: string; date: string }) =>
    z.object({ parkId: z.string().uuid(), date: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: park } = await supabase
      .from("parks")
      .select("latitude,longitude,city")
      .eq("id", data.parkId)
      .maybeSingle();
    const lat = Number(park?.latitude ?? 25.2);
    const lon = Number(park?.longitude ?? 80.83);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&start_date=${data.date}&end_date=${data.date}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("weather fetch failed");
      const json = (await res.json()) as any;
      const daily = json.daily ?? {};
      const code = daily.weathercode?.[0] ?? 0;
      const tMax = daily.temperature_2m_max?.[0] ?? null;
      const tMin = daily.temperature_2m_min?.[0] ?? null;
      const precipMm = daily.precipitation_sum?.[0] ?? 0;
      const precipProb = daily.precipitation_probability_max?.[0] ?? 0;
      const cond = codeToCondition(code);
      const warn = precipMm > 5 || precipProb > 60 || [95, 96, 99].includes(code);
      return { ok: true, tMax, tMin, precipMm, precipProb, condition: cond, warn, city: park?.city ?? "" };
    } catch {
      return { ok: false, tMax: null, tMin: null, precipMm: 0, precipProb: 0, condition: "unknown", warn: false, city: park?.city ?? "" };
    }
  });

function codeToCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Partly cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Fair";
}