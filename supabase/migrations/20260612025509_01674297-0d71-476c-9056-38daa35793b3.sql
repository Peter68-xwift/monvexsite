
CREATE SEQUENCE IF NOT EXISTS public.user_code_seq START WITH 12800 INCREMENT BY 1;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_code integer;

-- Backfill existing rows
UPDATE public.profiles SET user_code = nextval('public.user_code_seq') WHERE user_code IS NULL;

ALTER TABLE public.profiles ALTER COLUMN user_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_code SET DEFAULT nextval('public.user_code_seq');

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_code_key UNIQUE (user_code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update handle_new_user to set user_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.profiles (id, phone, full_name, referral_code, referred_by, user_code)
  VALUES (NEW.id, v_phone, v_full_name, public.generate_referral_code(), v_referrer, nextval('public.user_code_seq'));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $function$;
