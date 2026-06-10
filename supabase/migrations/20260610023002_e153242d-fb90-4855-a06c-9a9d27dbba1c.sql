
-- 1. Site settings singleton
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  withdrawals_enabled BOOLEAN NOT NULL DEFAULT true,
  tasks_enabled BOOLEAN NOT NULL DEFAULT true,
  registrations_enabled BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  min_deposit NUMERIC(14,2) NOT NULL DEFAULT 10,
  min_withdrawal NUMERIC(14,2) NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone reads settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admins update settings" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 2. Per-user withdrawal toggle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdrawal_enabled BOOLEAN NOT NULL DEFAULT true;

-- 3. Admin write policies on packages_catalog
CREATE POLICY "admins insert catalog" ON public.packages_catalog
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update catalog" ON public.packages_catalog
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete catalog" ON public.packages_catalog
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.packages_catalog TO authenticated;

-- 4. Allow admins to insert transactions (manual wallet adjustments)
CREATE POLICY "admins insert tx" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
