
CREATE TABLE public.gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  max_redemptions INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_codes TO authenticated;
GRANT ALL ON public.gift_codes TO service_role;
ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage gift codes" ON public.gift_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.gift_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  code TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT ON public.gift_redemptions TO authenticated;
GRANT ALL ON public.gift_redemptions TO service_role;
ALTER TABLE public.gift_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own redemptions" ON public.gift_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins view redemptions" ON public.gift_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published news" ON public.news_posts FOR SELECT TO authenticated USING (published);
CREATE POLICY "admins manage news" ON public.news_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS mpesa_message TEXT;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_withdrawn BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_packages ADD COLUMN IF NOT EXISTS last_claimed_at DATE;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS payment_paybill TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_account TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT NOT NULL DEFAULT 'Go to M-Pesa, select Lipa Na M-Pesa > Pay Bill, enter the Business Number and Account Number above, pay the amount you want to deposit, then paste the confirmation SMS below and click I have paid.',
  ADD COLUMN IF NOT EXISTS whatsapp_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_url TEXT NOT NULL DEFAULT '';

INSERT INTO public.news_posts (title, body) VALUES
  ('Welcome to Monvex', 'We are excited to have you onboard. Stay tuned for daily updates, promos and exclusive announcements.');
