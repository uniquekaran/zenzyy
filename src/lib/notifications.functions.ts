import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useSession } from "@tanstack/react-start/server";

const SESSION_PASSWORD =
  (process.env.LOVABLE_API_KEY || "zenzyy-dev-fallback-session-password-please-rotate-32") +
  "-zenzyy-otp-session-v1";

const otpSession = () =>
  useSession<{ phone?: string; code?: string; exp?: number; attempts?: number }>({
    password: SESSION_PASSWORD,
    name: "zenzyy_otp",
    maxAge: 60 * 10,
    cookie: { httpOnly: true, sameSite: "lax", secure: true, path: "/" },
  });

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+91" + digits;
  if (digits.length > 10) return "+" + digits;
  return "+91" + digits;
}

function newRequestId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function maskPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length < 4) return "***";
  return `***${d.slice(-4)}`;
}

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  if (!d) return "***";
  const head = u.slice(0, 2);
  return `${head}***@${d}`;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text.length > 500 ? text.slice(0, 500) + "…[truncated]" : text;
  }
}

function logEvent(event: Record<string, unknown>) {
  // Single-line JSON so it's grep-friendly in worker logs.
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...event }));
}

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string }) =>
    z.object({ phone: z.string().min(10).max(15) }).parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const requestId = newRequestId("sms");
    if (!apiKey) {
      logEvent({ scope: "fast2sms", event: "config_missing", requestId });
      throw new Error("SMS service not configured");
    }
    const phone = normalizePhone(data.phone);
    const localTen = phone.replace(/\D/g, "").slice(-10);
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
      apiKey,
    )}&route=otp&variables_values=${code}&numbers=${localTen}`;
    const startedAt = Date.now();
    logEvent({
      scope: "fast2sms",
      event: "request",
      requestId,
      endpoint: "/dev/bulkV2",
      phone: maskPhone(phone),
    });
    let res: Response;
    try {
      res = await fetch(url, { method: "GET" });
    } catch (err) {
      logEvent({
        scope: "fast2sms",
        event: "network_error",
        requestId,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new Error("Couldn't send OTP. Please try again.");
    }
    const text = await res.text();
    logEvent({
      scope: "fast2sms",
      event: "response",
      requestId,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      body: safeParse(text),
    });
    if (!res.ok) {
      throw new Error("Couldn't send OTP. Please try again.");
    }

    const session = await otpSession();
    await session.update({ phone, code, exp: Date.now() + 5 * 60 * 1000, attempts: 0 });
    return { ok: true, phone };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string; code: string }) =>
    z.object({ phone: z.string().min(10).max(15), code: z.string().regex(/^\d{6}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const session = await otpSession();
    const s = session.data;
    const phone = normalizePhone(data.phone);
    if (!s.code || !s.exp || s.phone !== phone) throw new Error("Please request a new OTP.");
    if (Date.now() > s.exp) {
      await session.clear();
      throw new Error("OTP expired. Please request a new one.");
    }
    if ((s.attempts ?? 0) >= 5) {
      await session.clear();
      throw new Error("Too many attempts. Please request a new OTP.");
    }
    if (s.code !== data.code) {
      await session.update({ ...s, attempts: (s.attempts ?? 0) + 1 });
      throw new Error("Incorrect OTP. Try again.");
    }
    await session.clear();

    // Issue Supabase magic link for this phone-derived email so client can establish a session.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const local = phone.replace(/\D/g, "");
    const email = `${local}@phone.zenzyy.in`;

    // Ensure user exists (idempotent)
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((u: any) => u.email === email);
    if (!found) {
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        phone: phone,
        user_metadata: { name: `Guest ${local.slice(-4)}`, phone },
      });
    }

    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      throw new Error("Couldn't establish session. Please try again.");
    }
    return { email, token: linkData.properties.hashed_token };
  });

export const sendTicketEmail = createServerFn({ method: "POST" })
  .inputValidator((d: {
    to: string;
    bookingCode: string;
    parkName: string;
    location: string;
    visitDate: string;
    adults: number;
    children: number;
    total: number;
    customerName: string;
    utr?: string;
  }) =>
    z
      .object({
        to: z.string().email(),
        bookingCode: z.string().min(3).max(50),
        parkName: z.string().min(1).max(120),
        location: z.string().min(1).max(160),
        visitDate: z.string().min(1).max(40),
        adults: z.number().int().min(0).max(50),
        children: z.number().int().min(0).max(50),
        total: z.number().min(0),
        customerName: z.string().min(1).max(120),
        utr: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    const requestId = newRequestId("eml");
    if (!apiKey) {
      logEvent({ scope: "resend", event: "config_missing", requestId });
      return { ok: false, skipped: true };
    }
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.12);">
      <div style="padding:28px 32px;background:linear-gradient(135deg,#06b6d4,#2563eb);color:#fff;">
        <div style="font-size:12px;letter-spacing:3px;opacity:.85;text-transform:uppercase;">Zenzyy Pass · VIP Entry</div>
        <h1 style="margin:6px 0 0;font-size:26px;font-weight:800;">${data.parkName}</h1>
        <p style="margin:4px 0 0;opacity:.92;font-size:14px;">${data.location}</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 18px;font-size:15px;">Hi ${data.customerName},</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.55;">Your booking is locked in. Show this email at the entrance gate — no queues, no waiting.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <tr><td style="padding:12px 16px;background:#f8fafc;color:#64748b;">Booking ID</td><td style="padding:12px 16px;font-weight:700;font-family:monospace;">${data.bookingCode}</td></tr>
          <tr><td style="padding:12px 16px;background:#f8fafc;color:#64748b;border-top:1px solid #e2e8f0;">Visit date</td><td style="padding:12px 16px;font-weight:600;border-top:1px solid #e2e8f0;">${data.visitDate}</td></tr>
          <tr><td style="padding:12px 16px;background:#f8fafc;color:#64748b;border-top:1px solid #e2e8f0;">Guests</td><td style="padding:12px 16px;font-weight:600;border-top:1px solid #e2e8f0;">${data.adults} Adult${data.children ? `, ${data.children} Child` : ""}</td></tr>
          <tr><td style="padding:12px 16px;background:#f8fafc;color:#64748b;border-top:1px solid #e2e8f0;">Total paid</td><td style="padding:12px 16px;font-weight:800;color:#0ea5e9;border-top:1px solid #e2e8f0;">₹${data.total.toLocaleString("en-IN")} <span style="font-weight:500;color:#64748b;font-size:12px;">(zero taxes · zero fees)</span></td></tr>
          ${data.utr ? `<tr><td style="padding:12px 16px;background:#f8fafc;color:#64748b;border-top:1px solid #e2e8f0;">UTR</td><td style="padding:12px 16px;font-family:monospace;border-top:1px solid #e2e8f0;">${data.utr}</td></tr>` : ""}
        </table>
        <div style="margin:22px 0;padding:14px 16px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;font-size:13px;color:#0e7490;">
          🎟️ Instant VIP entry at the gate. Carry one valid ID for verification.
        </div>
        <p style="margin:0;font-size:13px;color:#64748b;">Questions? Just reply to this email. See you at the splash!</p>
        <p style="margin:18px 0 0;font-size:13px;color:#0f172a;font-weight:700;">— Team Zenzyy</p>
      </div>
      <div style="padding:14px 32px;background:#0f172a;color:#94a3b8;font-size:11px;text-align:center;">Zenzyy · Skip the lines. Dive right in.</div>
    </div></body></html>`;

    const startedAt = Date.now();
    logEvent({
      scope: "resend",
      event: "request",
      requestId,
      endpoint: "/emails",
      to: maskEmail(data.to),
      bookingCode: data.bookingCode,
    });
    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Zenzyy Tickets <onboarding@resend.dev>",
          to: [data.to],
          subject: "Your Zenzyy Waterpark Ticket Confirmation! 🎟️🌊",
          html,
        }),
      });
    } catch (err) {
      logEvent({
        scope: "resend",
        event: "network_error",
        requestId,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err),
      });
      return { ok: false, error: "network_error" };
    }
    const text = await res.text();
    const parsed = safeParse(text);
    const providerId =
      typeof parsed === "object" && parsed && "id" in parsed
        ? (parsed as { id?: string }).id
        : undefined;
    logEvent({
      scope: "resend",
      event: "response",
      requestId,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      providerId,
      body: parsed,
    });
    if (!res.ok) {
      return { ok: false, error: "email_failed", requestId };
    }
    return { ok: true, requestId, providerId };
  });