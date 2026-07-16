# Zenzyy Ecosystem Upgrade — Phased Build Plan

This is a very large request (8 major feature domains). I'll ship it in **3 approved migrations + focused UI phases** so each piece is verifiable, not one giant unreviewable dump.

---

## Phase 1 — Database foundation (1 migration)

New tables:
- `park_zones` — `park_id`, `name`, `zone_type` (wave|lazy|extreme|kids|food), `height_min_cm`, `weight_max_kg`, `safety_notes`, `avg_wait_minutes`, `x_pct`, `y_pct` (for map placement). Public SELECT.
- `ticket_tiers` — `park_id`, `code` (standard|fastpass|season), `name`, `adult_price`, `child_price`, `perks` jsonb. Public SELECT.
- `transport_options` — `code` (cab|minibus|shuttle), `name`, `base_fare`, `per_km`. Public SELECT.
- `wallet_accounts` — `user_id` unique, `balance` numeric, `referral_code` text unique. RLS owner-only.
- `wallet_transactions` — `user_id`, `amount`, `type` (credit|debit), `reason`, `booking_id?`. RLS owner-only.
- `referrals` — `referrer_id`, `referred_id` unique, `status`, `credited_at`. RLS owner-only read.
- `user_roles` + `app_role` enum + `has_role()` security-definer (for admin route).
- `chatbot_faqs` — `question`, `answer`, `keywords[]`. Public SELECT.

Extend `bookings`:
- `tier_code` text (default 'standard')
- `transport` jsonb (option, pickup, fare)
- `wallet_applied` numeric default 0
- `referral_code_used` text

Seed: zones for existing park, 3 tiers, 3 transport options, ~10 FAQs.

Trigger: on new profile → create `wallet_accounts` row with random referral_code.

## Phase 2 — Server logic & core booking upgrade

`src/lib/`:
- `zones.functions.ts` — list zones per park (public).
- `tiers.functions.ts` — list tiers per park (public).
- `transport.functions.ts` — list options + `estimateFare({option, distanceKm})`.
- `wallet.functions.ts` — `getMyWallet`, `applyReferral(code)`, credits on booking via `createBooking`.
- `weather.functions.ts` — fetches Open-Meteo (free, no key) for park coords + date, returns `{tempC, precipMm, condition, warn}`.
- `chatbot.functions.ts` — `askZenBot(question)` — matches FAQ keywords, falls back to Lovable AI Gemini flash-lite with FAQ context.
- `admin.functions.ts` — `requireAdmin` helper, `getAdminStats`, `listRecentBookings`, `verifyBookingByCode`, `setRushOverride`.

Update `createBookingFn`:
- Accept `tierCode`, `transport`, `walletApply`, `referralCode`.
- Compute price by tier, add transport fare, subtract wallet.
- If `referralCode` valid & first booking → credit ₹100 to referrer, record `referrals`.

## Phase 3 — UI (broken into 4 shippable chunks)

**3a. Park page upgrades** (`park.$parkId.tsx`)
- Tier selector cards (Standard / FastPass VIP / Season).
- Transport section with pickup input + vehicle select + live fare.
- Weather widget (auto-fetches on date change, shows rain warning banner).
- Interactive zone map (SVG overlay on hero image, clickable hotspots → Drawer with restrictions + wait time).

**3b. Checkout & E-Ticket**
- Checkout: show wallet balance + "Apply ₹X" toggle, referral code field.
- Success page: PDF download (jspdf), "Save Offline Pass" full-screen QR view, larger booking code.

**3c. Dashboard additions**
- Wallet card (balance, referral link with copy button, recent tx list).
- Existing bookings list stays.

**3d. ZenBot + Admin**
- Floating `<ZenBot />` component in `__root.tsx` — chat drawer, calls `askZenBot`.
- `/admin` route — role-gated. Stats cards, rush toggle, recent bookings table with search, QR verify input.

---

## Technical notes
- Weather: Open-Meteo `https://api.open-meteo.com/v1/forecast` (no key). Park needs `latitude`/`longitude` — I'll add nullable cols and default to Chitrakoot coords.
- PDF: `jspdf` + `qrcode` (already installed).
- ZenBot AI fallback: `google/gemini-3.1-flash-lite` via Lovable AI Gateway (no user key).
- Admin role: first user can self-promote via seeded SQL note; or I'll add a one-shot server fn `claimFirstAdmin()` that only works when no admin exists.

## Out of scope (won't build unless asked)
- Real payment gateway
- Real Apple/Google Wallet .pkpass files (we render a "wallet-style" offline card)
- Real-time wait times (uses seeded `avg_wait_minutes` + small random jitter)
- SMS/push for referral credit

---

**Proceed?** I'll start with Phase 1 (migration) on approval, then work through phases sequentially — each phase verified before the next.
