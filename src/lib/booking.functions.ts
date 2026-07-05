import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listAddons = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("add_ons").select("*").eq("active", true);
  if (error) return { addons: [] as any[], error: error.message };
  return { addons: data ?? [] };
});

export const getRushLevel = createServerFn({ method: "GET" })
  .inputValidator((d: { parkId: string; date: string }) =>
    z.object({ parkId: z.string().uuid(), date: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("bookings")
      .select("adult_count,child_count,status")
      .eq("park_id", data.parkId)
      .eq("visit_date", data.date)
      .neq("status", "cancelled");
    if (error) return { level: "low" as const, count: 0, guests: 0 };
    const guests = (rows ?? []).reduce(
      (n, r: any) => n + (r.adult_count ?? 0) + (r.child_count ?? 0),
      0,
    );
    let level: "low" | "moderate" | "high" = "low";
    if (guests >= 150) level = "high";
    else if (guests >= 60) level = "moderate";
    return { level, count: rows?.length ?? 0, guests };
  });

const AddonLine = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    parkId: string;
    visitDate: string;
    adults: number;
    children: number;
    addons: { id: string; quantity: number }[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    utr?: string;
  }) =>
    z
      .object({
        parkId: z.string().uuid(),
        visitDate: z.string().min(1),
        adults: z.number().int().min(0).max(50),
        children: z.number().int().min(0).max(50),
        addons: z.array(AddonLine).max(30),
        customerName: z.string().trim().min(2).max(80),
        customerEmail: z.string().trim().email().max(255),
        customerPhone: z.string().trim().min(7).max(20),
        utr: z.string().trim().optional(),
      })
      .refine((v) => v.adults + v.children > 0, { message: "Add at least one guest" })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load park price
    const { data: park, error: parkErr } = await supabase
      .from("parks")
      .select("id,name,price")
      .eq("id", data.parkId)
      .maybeSingle();
    if (parkErr || !park) throw new Error("Park not found");

    const isVWorld = park.name?.toLowerCase().includes("v world");
    const adultPrice = isVWorld ? 399 : Number(park.price);
    const childPrice = isVWorld ? 299 : Math.round(adultPrice * 0.6);
    const ticketSubtotal = data.adults * adultPrice + data.children * childPrice;

    // Load add-ons for pricing
    let addonSubtotal = 0;
    const addonSnapshot: any[] = [];
    if (data.addons.length > 0) {
      const ids = data.addons.map((a) => a.id);
      const { data: catalog, error: aErr } = await supabase
        .from("add_ons")
        .select("id,name,variant,type,price")
        .in("id", ids)
        .eq("active", true);
      if (aErr) throw new Error("Could not price add-ons");
      for (const line of data.addons) {
        const item = (catalog ?? []).find((c) => c.id === line.id);
        if (!item) continue;
        const lineTotal = Number(item.price) * line.quantity;
        addonSubtotal += lineTotal;
        addonSnapshot.push({
          id: item.id,
          name: item.name,
          variant: item.variant,
          type: item.type,
          unit_price: Number(item.price),
          quantity: line.quantity,
          total: lineTotal,
        });
      }
    }

    const subtotal = ticketSubtotal + addonSubtotal;
    const totalGuests = data.adults + data.children;
    let discountAmount = 0;
    let discountReason: string | null = null;
    if (totalGuests >= 5) {
      discountAmount = Math.round(subtotal * 0.1);
      discountReason = "Family & Friends discount (5+ guests, 10% off)";
    }
    const total = subtotal - discountAmount;

    const status = data.utr ? "pending_verification" : "confirmed";

    const { data: booking, error: insErr } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        park_id: data.parkId,
        visit_date: data.visitDate,
        adult_count: data.adults,
        child_count: data.children,
        total_amount: total,
        subtotal,
        discount_amount: discountAmount,
        discount_reason: discountReason,
        addons: addonSnapshot,
        status,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        ticket_data: {
          method: data.utr ? "upi" : "simulated",
          utr: data.utr ?? null,
          adultPrice,
          childPrice,
          ticketSubtotal,
          addonSubtotal,
          park_name: park.name,
        },
      })
      .select("id,booking_code")
      .single();
    if (insErr || !booking) throw new Error(insErr?.message ?? "Booking failed");

    return {
      id: booking.id,
      bookingCode: booking.booking_code,
      subtotal,
      discountAmount,
      discountReason,
      total,
    };
  });

export const rescheduleBookingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; newDate: string }) =>
    z.object({ id: z.string().uuid(), newDate: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id,visit_date,status,original_visit_date")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") throw new Error("Cancelled bookings can't be rescheduled");

    const now = new Date();
    const currentVisit = new Date(booking.visit_date as string);
    currentVisit.setHours(0, 0, 0, 0);
    const hoursUntil = (currentVisit.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < 24) throw new Error("Reschedule requires at least 24 hours notice");

    const newDate = new Date(data.newDate);
    newDate.setHours(0, 0, 0, 0);
    if (newDate <= now) throw new Error("Choose a future date");

    const { error: upErr } = await supabase
      .from("bookings")
      .update({
        visit_date: data.newDate,
        original_visit_date: booking.original_visit_date ?? booking.visit_date,
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    await supabase.from("booking_events").insert({
      booking_id: data.id,
      user_id: userId,
      event_type: "rescheduled",
      from_date: booking.visit_date,
      to_date: data.newDate,
    });
    return { ok: true };
  });

export const cancelBookingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason?: string }) =>
    z.object({ id: z.string().uuid(), reason: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id,visit_date,status")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !booking) throw new Error("Booking not found");
    if (booking.status === "cancelled") return { ok: true };

    const { error: upErr } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    await supabase.from("booking_events").insert({
      booking_id: data.id,
      user_id: userId,
      event_type: "cancelled",
      from_date: booking.visit_date,
      reason: data.reason ?? null,
    });
    return { ok: true };
  });