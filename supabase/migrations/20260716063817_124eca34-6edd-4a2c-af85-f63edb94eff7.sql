
-- === ROLES ===
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- === PARKS: coords ===
ALTER TABLE public.parks
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
UPDATE public.parks SET latitude = COALESCE(latitude, 25.2000), longitude = COALESCE(longitude, 80.8333);

-- === PARK ZONES ===
CREATE TABLE public.park_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id uuid NOT NULL REFERENCES public.parks(id) ON DELETE CASCADE,
  name text NOT NULL,
  zone_type text NOT NULL,
  height_min_cm integer,
  weight_max_kg integer,
  safety_notes text,
  avg_wait_minutes integer NOT NULL DEFAULT 10,
  x_pct numeric NOT NULL DEFAULT 50,
  y_pct numeric NOT NULL DEFAULT 50,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.park_zones TO anon, authenticated;
GRANT ALL ON public.park_zones TO service_role;
ALTER TABLE public.park_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones public" ON public.park_zones FOR SELECT USING (true);

-- === TICKET TIERS ===
CREATE TABLE public.ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id uuid REFERENCES public.parks(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  adult_price numeric NOT NULL,
  child_price numeric NOT NULL,
  perks jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ticket_tiers TO anon, authenticated;
GRANT ALL ON public.ticket_tiers TO service_role;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers public" ON public.ticket_tiers FOR SELECT USING (active = true);

-- === TRANSPORT ===
CREATE TABLE public.transport_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  base_fare numeric NOT NULL,
  per_km numeric NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 4,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transport_options TO anon, authenticated;
GRANT ALL ON public.transport_options TO service_role;
ALTER TABLE public.transport_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport public" ON public.transport_options FOR SELECT USING (active = true);

-- === WALLET ===
CREATE TABLE public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_accounts TO authenticated;
GRANT ALL ON public.wallet_accounts TO service_role;
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON public.wallet_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL,
  reason text NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- === CHATBOT FAQ ===
CREATE TABLE public.chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chatbot_faqs TO anon, authenticated;
GRANT ALL ON public.chatbot_faqs TO service_role;
ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public" ON public.chatbot_faqs FOR SELECT USING (true);

-- === BOOKINGS: extend ===
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS tier_code text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS transport jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wallet_applied numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code_used text;

-- === RUSH OVERRIDES (admin) ===
CREATE TABLE IF NOT EXISTS public.rush_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id uuid NOT NULL REFERENCES public.parks(id) ON DELETE CASCADE,
  level text NOT NULL,
  set_by uuid REFERENCES auth.users(id),
  active_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rush_overrides TO anon, authenticated;
GRANT ALL ON public.rush_overrides TO service_role;
ALTER TABLE public.rush_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rush public read" ON public.rush_overrides FOR SELECT USING (true);

-- === WALLET AUTOCREATE TRIGGER ===
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallet_accounts (user_id, referral_code)
  VALUES (NEW.id, 'ZNY' || upper(substr(md5(NEW.id::text || random()::text), 1, 6)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS wallet_on_profile_insert ON public.profiles;
CREATE TRIGGER wallet_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();

-- backfill wallets
INSERT INTO public.wallet_accounts (user_id, referral_code)
SELECT p.id, 'ZNY' || upper(substr(md5(p.id::text), 1, 6))
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.wallet_accounts w WHERE w.user_id = p.id)
ON CONFLICT DO NOTHING;

-- === SEEDS ===
-- Tiers (global, park_id NULL applies to all)
INSERT INTO public.ticket_tiers (code, name, description, adult_price, child_price, perks) VALUES
  ('standard','Standard Entry','Full-day park access, all standard zones.',399,299,'["Full day access","All standard slides","Locker rental optional"]'::jsonb),
  ('fastpass','FastPass VIP','Skip queues at all major slides + priority locker.',799,599,'["Skip-the-line at 5+ major slides","Priority locker","Complimentary welcome drink"]'::jsonb),
  ('season','Season Pass','Unlimited entries for 30 days.',2999,1999,'["Unlimited entries for 30 days","Free locker every visit","10% off food & costumes"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Transport
INSERT INTO public.transport_options (code, name, description, base_fare, per_km, capacity) VALUES
  ('cab','Private Cab','Sedan / hatchback, up to 4 riders.',150,14,4),
  ('minibus','Mini Bus','Shared mini-bus, up to 12 riders.',80,9,12),
  ('shuttle','Private Shuttle','Tempo Traveller, up to 17 riders.',400,22,17)
ON CONFLICT (code) DO NOTHING;

-- Zones (attach to first park)
INSERT INTO public.park_zones (park_id, name, zone_type, height_min_cm, weight_max_kg, safety_notes, avg_wait_minutes, x_pct, y_pct, icon)
SELECT p.id, z.name, z.zone_type, z.height_min_cm, z.weight_max_kg, z.safety_notes, z.avg_wait_minutes, z.x_pct, z.y_pct, z.icon
FROM public.parks p
CROSS JOIN (VALUES
  ('Wave Pool','wave',110,NULL,'Non-swimmers must wear life vests. Follow lifeguard whistle.',12,30,60,'waves'),
  ('Lazy River','lazy',NULL,NULL,'Tubes provided. Children under 8 need adult supervision.',5,55,75,'droplet'),
  ('Extreme Slides','extreme',130,90,'Height 130cm+ required. Not recommended for pregnant guests or heart conditions.',22,75,25,'zap'),
  ('Kids Zone','kids',NULL,40,'Ages 3-10. Parent supervision mandatory.',3,20,30,'baby'),
  ('Food Court','food',NULL,NULL,'Multi-cuisine. Outside food not permitted.',0,50,45,'utensils'),
  ('Rain Dance Arena','wave',105,NULL,'Non-slip footwear recommended.',8,80,60,'cloud-rain')
) AS z(name,zone_type,height_min_cm,weight_max_kg,safety_notes,avg_wait_minutes,x_pct,y_pct,icon)
WHERE NOT EXISTS (SELECT 1 FROM public.park_zones WHERE park_id = p.id)
ORDER BY p.created_at LIMIT 6;

-- FAQs
INSERT INTO public.chatbot_faqs (question, answer, keywords, sort_order) VALUES
  ('What are the park timings?','The water park is open from 10:00 AM to 6:00 PM every day, including weekends.',ARRAY['timing','time','hours','open','close'],1),
  ('Are outside foods allowed?','No, outside food and beverages are not permitted. Our food court offers a wide multi-cuisine menu.',ARRAY['food','outside','eat','snack','drink'],2),
  ('What is the ticket price for children?','Children (below 12 years) are ₹299 for Standard, ₹599 for FastPass VIP.',ARRAY['child','children','kid','price','ticket'],3),
  ('What is the ticket price for adults?','Adults are ₹399 for Standard, ₹799 for FastPass VIP, and ₹2999 for a Season Pass.',ARRAY['adult','price','ticket','entry'],4),
  ('Do you provide lockers?','Yes, lockers can be pre-booked as an add-on, or rented at the park (₹100 refundable deposit).',ARRAY['locker','storage','bag'],5),
  ('Are costumes available for rent?','Yes, we rent swim costumes in sizes S/M/L/XL. You can add them during booking.',ARRAY['costume','swimwear','clothes','rent'],6),
  ('Is parking available?','Yes, free parking for 500+ vehicles.',ARRAY['parking','park','car','vehicle'],7),
  ('Can I cancel or reschedule my booking?','Yes — reschedule or cancel free of charge up to 24 hours before your visit date.',ARRAY['cancel','reschedule','refund','change'],8),
  ('What if it rains?','Check the weather widget on the booking page. If heavy rain is forecast we recommend rescheduling — free up to 24h before visit.',ARRAY['rain','weather','storm','forecast'],9),
  ('Do you offer group discounts?','Yes — a 10% Family & Friends discount is applied automatically for 5+ guests.',ARRAY['group','discount','family','offer'],10),
  ('Is there transportation?','Yes, you can book a cab, mini-bus or private shuttle during checkout with an instant fare estimate.',ARRAY['transport','cab','bus','pickup','ride','shuttle'],11),
  ('What is Zenzyy Cash?','Refer a friend and get ₹100 Zenzyy Cash when they book — usable on future tickets, food or costumes.',ARRAY['zenzyy','cash','referral','wallet','refer','friend'],12)
ON CONFLICT DO NOTHING;
