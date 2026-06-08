
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.tx_type AS ENUM ('deposit', 'withdrawal', 'rebate', 'gift');
CREATE TYPE public.tx_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE public.package_status AS ENUM ('active', 'expired', 'cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  fund_password_hash TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Packages catalog
CREATE TABLE public.packages_catalog (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  deposit NUMERIC(14,2) NOT NULL,
  daily_income NUMERIC(14,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  total_return NUMERIC(14,2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.packages_catalog TO authenticated, anon;
GRANT ALL ON public.packages_catalog TO service_role;
ALTER TABLE public.packages_catalog ENABLE ROW LEVEL SECURITY;

-- User packages
CREATE TABLE public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  package_code TEXT NOT NULL REFERENCES public.packages_catalog(code),
  status package_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_income_at TIMESTAMPTZ,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_packages TO authenticated;
GRANT ALL ON public.user_packages TO service_role;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  type tx_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status tx_status NOT NULL DEFAULT 'pending',
  mpesa_number TEXT,
  reference TEXT,
  description TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tx_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_tx_status ON public.transactions(status);

-- RLS policies
-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "view referrer's downline" ON public.profiles FOR SELECT TO authenticated USING (referred_by = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- packages_catalog
CREATE POLICY "anyone reads catalog" ON public.packages_catalog FOR SELECT TO authenticated, anon USING (true);

-- user_packages
CREATE POLICY "view own packages" ON public.user_packages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins view all packages" ON public.user_packages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "view downline packages" ON public.user_packages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_packages.user_id AND p.referred_by = auth.uid())
);

-- transactions
CREATE POLICY "view own tx" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins view tx" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update tx" ON public.transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "view downline tx" ON public.transactions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = transactions.user_id AND p.referred_by = auth.uid())
);

-- referral code generator + new user trigger
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone TEXT;
  v_full_name TEXT;
  v_ref_code TEXT;
  v_referrer UUID;
BEGIN
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, NEW.email);
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_ref_code := COALESCE(NEW.raw_user_meta_data->>'referral_code', '');
  IF v_ref_code <> '' THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = v_ref_code LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, phone, full_name, referral_code, referred_by)
  VALUES (NEW.id, v_phone, v_full_name, public.generate_referral_code(), v_referrer);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER transactions_touch BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed packages
INSERT INTO public.packages_catalog (code, name, deposit, daily_income, duration_days, total_return, sort_order) VALUES
  ('C1', 'Plan C1',  800,    40, 30, 1200,  1),
  ('C2', 'Plan C2', 1800,    90, 30, 2700,  2),
  ('C3', 'Plan C3', 3600,   180, 30, 5400,  3),
  ('C4', 'Plan C4', 7200,   360, 30,10800,  4);
