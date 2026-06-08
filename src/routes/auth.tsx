import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isValidKePhone, normalizePhone, phoneToEmail } from "@/hooks/useAuth";
import { Loader2, Phone, Lock, UserPlus, LogIn } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Monvex" }, { name: "description", content: "Sign in to Monvex." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referral, setReferral] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidKePhone(phone)) { setError("Enter a valid Kenyan phone (e.g. 07XX XXX XXX)"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const norm = normalizePhone(phone);
    const email = phoneToEmail(norm);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { phone: norm, full_name: fullName || null, referral_code: referral.trim().toUpperCase() || null },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] via-[#2456a6] to-[#3b82f6] px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7">
        <div className="flex items-center justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white flex items-center justify-center font-bold text-xl shadow-lg">M</div>
        </div>
        <h1 className="text-2xl font-extrabold text-center text-slate-900">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
        <p className="text-center text-sm text-slate-500 mt-1">Monvex Holdings — KES wallet & daily income</p>

        <div className="mt-6 grid grid-cols-2 bg-slate-100 rounded-xl p-1 text-sm font-semibold">
          <button onClick={() => setMode("signin")} className={`py-2 rounded-lg transition ${mode === "signin" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>Sign in</button>
          <button onClick={() => setMode("signup")} className={`py-2 rounded-lg transition ${mode === "signup" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>Sign up</button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <Field label="Full name (optional)">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-transparent outline-none text-sm" placeholder="John Doe" />
            </Field>
          )}
          <Field label="M-Pesa phone" icon={<Phone className="h-4 w-4 text-slate-400" />}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className="w-full bg-transparent outline-none text-sm" placeholder="07XX XXX XXX" />
          </Field>
          <Field label="Password" icon={<Lock className="h-4 w-4 text-slate-400" />}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full bg-transparent outline-none text-sm" placeholder="••••••••" />
          </Field>
          {mode === "signup" && (
            <Field label="Referral code (optional)">
              <input value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} className="w-full bg-transparent outline-none text-sm uppercase tracking-wider" placeholder="ABCD1234" />
            </Field>
          )}

          {error && <p className="text-xs text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <button disabled={loading} className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white font-semibold py-3 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          By continuing, you agree to Monvex's Terms.
          <br />
          <Link to="/" className="text-[#2456a6] font-medium">Back to home</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-[#3b82f6] focus-within:bg-white">
        {icon}
        {children}
      </div>
    </label>
  );
}