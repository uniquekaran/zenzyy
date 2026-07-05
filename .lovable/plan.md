## Zenzyy Advanced Booking Platform — Build Plan

Big scope. Splitting into focused phases so each ships working end‑to‑end.

### Phase 1 — Database (single migration)
Extend the schema without breaking existing `bookings` rows.

- `add_ons` (catalog): `id`, `type` (costume|locker|food), `name`, `variant` (S/M/L/XL, small/large, etc.), `price`, `active`. Public SELECT.
- `bookings` — add: `addons` jsonb (line items snapshot), `subtotal`, `discount_amount`, `discount_reason`, `original_visit_date` (for reschedule audit).
- `booking_events` (audit for reschedule/cancel): `id`, `booking_id`, `user_id`, `event_type` (rescheduled|cancelled), `from_date`, `to_date`, `reason`, `created_at`. RLS owner-only.
- Seed add‑ons catalog (costumes S/M/L/XL, small/large locker, buffet combo).
- GRANTs + RLS on every new public table.

### Phase 2 — Server functions (`src/lib/booking.functions.ts`)
- `listAddons()` — public read.
- `getRushLevel({ parkId, date })` — public; counts confirmed bookings for date → returns `low|moderate|high` + count.
- `createBooking(...)` — auth; recomputes total server‑side (never trusts client), applies 5+ people 10% discount, inserts booking + emits Resend email + Fast2SMS notify (best‑effort, catch & log).
- `rescheduleBooking({ id, newDate })` — auth; enforces ≥24h before current visit; writes `booking_events`.
- `cancelBooking({ id, reason })` — auth; sets status=`cancelled`, writes event.

### Phase 3 — Booking UI (`/park/$parkId` upgrade)
Enhance existing park detail booking widget:
- Adults/Children counters (exist) + Add‑ons picker (tabs: Costumes / Lockers / Food).
- Live price breakdown: tickets, add‑ons, subtotal, group discount (5+ → −10%), total.
- Live Rush Meter for selected date (green/yellow/red pill with dot animation).
- "Proceed to Checkout" passes add‑ons via search params.

### Phase 4 — Checkout & E‑Ticket
- Update `_authenticated/checkout.tsx` to read add‑ons, call `createBooking`.
- Rebuild `success.$bookingId.tsx` as premium E‑Ticket: booking code, date, ticket + add‑on summary, QR code (using `qrcode` npm — encodes booking code + verification URL), print‑friendly.

### Phase 5 — Dashboard (`/dashboard`)
- Tabs: Upcoming / Past / Cancelled.
- Each card: park, date, guests, total, status.
- "Reschedule" (date picker, blocks <24h), "Cancel" (refund policy modal).
- Empty states.

### Phase 6 — Theme polish
- Homepage: add live rush indicator preview for featured park.
- Water‑themed gradients already exist (`--gradient-aqua`); tighten motion on counters, add wave hover on CTA. Mobile: sticky bottom price bar on park detail.

### Technical notes
- Auth: mutations use `requireSupabaseAuth`; reads (`listAddons`, `getRushLevel`) use publishable server client so they work in public loaders.
- Rush thresholds: <30 low, 30–70 moderate, >70 high (per park/date).
- Discount computed server‑side; client shows same formula for UX only.
- Notifications wrapped in try/catch — booking must not fail if email/SMS fails.
- QR: `qrcode` → data URL, rendered as `<img>`.
- No changes to auto‑generated Supabase files.

### Out of scope (flag for follow‑up)
- Real payment processing (checkout stays simulated, matching current app).
- Admin panel for editing add‑ons catalog.
- Real‑time rush updates via websocket (uses on‑demand query invalidation instead).

Confirm and I'll build Phase 1 (migration) first, then proceed through the phases.
