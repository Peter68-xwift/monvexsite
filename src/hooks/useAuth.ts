import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading, signedIn: !!user };
}

export function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, "")}@monvex.app`;
}

export function normalizePhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  // Normalize Safaricom: 07.., 7.., 2547.., +2547..
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return "254" + d.slice(1);
  if (d.startsWith("7") || d.startsWith("1")) return "254" + d;
  return d;
}

export function isValidKePhone(phone: string) {
  const d = normalizePhone(phone);
  return /^254(7|1)\d{8}$/.test(d);
}