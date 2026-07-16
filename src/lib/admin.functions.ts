import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(context: any) {
  const { supabase, userId } = context;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin access required");
}

/** One-shot: first user can grab admin if no admin exists yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Admin already exists");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayBookings } = await supabaseAdmin
      .from("bookings")
      .select("adult_count,child_count,total_amount,status")
      .eq("visit_date", today);
    const { data: allActive } = await supabaseAdmin
      .from("bookings")
      .select("total_amount,status")
      .neq("status", "cancelled");
    const ticketsToday = (todayBookings ?? []).reduce(
      (n, r: any) => n + (r.status !== "cancelled" ? r.adult_count + r.child_count : 0),
      0,
    );
    const revenueToday = (todayBookings ?? []).reduce(
      (n, r: any) => n + (r.status !== "cancelled" ? Number(r.total_amount) : 0),
      0,
    );
    const revenueTotal = (allActive ?? []).reduce(
      (n, r: any) => n + Number(r.total_amount),
      0,
    );
    return {
      ticketsToday,
      revenueToday,
      revenueTotal,
      bookingsTotal: (allActive ?? []).length,
    };
  });

export const listRecentBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; limit?: number }) =>
    z.object({ search: z.string().max(80).optional(), limit: z.number().int().min(1).max(200).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("bookings")
      .select("id,booking_code,customer_name,customer_email,visit_date,adult_count,child_count,total_amount,status,created_at,tier_code")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.search) {
      q = q.or(
        `booking_code.ilike.%${data.search}%,customer_name.ilike.%${data.search}%,customer_email.ilike.%${data.search}%`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { bookings: rows ?? [] };
  });

export const verifyBookingByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().min(3).max(30) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("bookings")
      .select("id,booking_code,customer_name,visit_date,adult_count,child_count,total_amount,status")
      .eq("booking_code", data.code)
      .maybeSingle();
    if (!row) return { found: false as const };
    return { found: true as const, booking: row };
  });

export const setRushOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { parkId: string; level: "low" | "moderate" | "high" }) =>
    z.object({ parkId: z.string().uuid(), level: z.enum(["low", "moderate", "high"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const until = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("rush_overrides").insert({
      park_id: data.parkId,
      level: data.level,
      active_until: until,
      set_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });