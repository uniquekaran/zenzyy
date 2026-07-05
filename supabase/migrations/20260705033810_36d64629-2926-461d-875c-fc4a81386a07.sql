
-- 1. Add-ons catalog
CREATE TABLE public.add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('costume','locker','food')),
  name text NOT NULL,
  variant text,
  price numeric NOT NULL CHECK (price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.add_ons TO anon, authenticated;
GRANT ALL ON public.add_ons TO service_role;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Add-ons are public" ON public.add_ons FOR SELECT USING (active = true);

-- 2. Extend bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text,
  ADD COLUMN IF NOT EXISTS original_visit_date date;

-- Allow owners to soft-cancel (need DELETE-like flow via UPDATE only)
-- Existing UPDATE policy already allows owner updates.

-- 3. Booking events (audit log)
CREATE TABLE public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('rescheduled','cancelled')),
  from_date date,
  to_date date,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking events viewable by owner" ON public.booking_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Booking events insertable by owner" ON public.booking_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Seed add-ons
INSERT INTO public.add_ons (type, name, variant, price) VALUES
  ('costume','Swim Costume','S',149),
  ('costume','Swim Costume','M',149),
  ('costume','Swim Costume','L',149),
  ('costume','Swim Costume','XL',179),
  ('locker','Locker','Small',99),
  ('locker','Locker','Large',179),
  ('food','Entry + Buffet Lunch Combo','Adult',299),
  ('food','Entry + Buffet Lunch Combo','Child',199),
  ('food','Snack Pack','Regular',149);
