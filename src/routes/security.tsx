import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, RefreshCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { updateLoginPassword, setFundPassword, deleteMyAccount } from "@/lib/monvex.functions";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Account Security — Monvex" }] }),
  component: Security,
});

type Panel = "menu" | "reset" | "fund" | "login" | "change" | "delete";

function Security() {
  const [panel, setPanel] = useState<Panel>("menu");
  const navigate = useNavigate();
  const updatePwd = useServerFn(updateLoginPassword);
  const setFund = useServerFn(setFundPassword);
  const delMe = useServerFn(deleteMyAccount);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const setV = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));

  async function handleResetPassword() {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(`${(vals.contact || "").replace(/\D/g, "")}@monvex.app`);
      if (error) throw error;
      setMsg({ kind: "ok", text: "If the account exists, a reset has been initiated." });
    } catch (e: any) { setMsg({ kind: "err", text: e.message }); }
    finally { setBusy(false); }
  }
  async function handleChangePassword() {
    setBusy(true); setMsg(null);
    try {
      if (!vals.new_password || vals.new_password.length < 6) throw new Error("New password too short");
      if (vals.new_password !== vals.confirm) throw new Error("Passwords do not match");
      await updatePwd({ data: { new_password: vals.new_password } });
      setMsg({ kind: "ok", text: "Password updated." });
    } catch (e: any) { setMsg({ kind: "err", text: e.message }); }
    finally { setBusy(false); }
  }
  async function handleFund() {
    setBusy(true); setMsg(null);
    try {
      if (!/^\d{4,12}$/.test(vals.fund || "")) throw new Error("Fund password must be digits");
      if (vals.fund !== vals.fund_confirm) throw new Error("Passwords do not match");
      await setFund({ data: { fund_password: vals.fund } });
      setMsg({ kind: "ok", text: "Fund password saved." });
    } catch (e: any) { setMsg({ kind: "err", text: e.message }); }
    finally { setBusy(false); }
  }
  async function handleDelete() {
    setBusy(true); setMsg(null);
    try {
      if (vals.confirm_delete !== "DELETE") throw new Error("Type DELETE to confirm");
      await delMe();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (e: any) { setMsg({ kind: "err", text: e.message }); setBusy(false); }
  }

  const items: { id: Panel; label: string; desc: string; Icon: any; color: string }[] = [
    { id: "reset", label: "Password Reset", desc: "Reset via email or SMS", Icon: RefreshCcw, color: "bg-sky-500" },
    { id: "fund", label: "Fund Password", desc: "Set or update withdrawal PIN", Icon: ShieldCheck, color: "bg-emerald-500" },
    { id: "login", label: "Login Password", desc: "Manage your sign-in password", Icon: KeyRound, color: "bg-indigo-500" },
    { id: "change", label: "Change Login Password", desc: "Replace current login password", Icon: Lock, color: "bg-amber-500" },
    { id: "delete", label: "Delete Account", desc: "Permanently remove your account", Icon: Trash2, color: "bg-rose-500" },
  ];

  return (
    <Shell>
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => panel === "menu" ? null : setPanel("menu")} className="rounded-full bg-white p-2 shadow">
            {panel === "menu" ? <Link to="/profile"><ArrowLeft className="h-5 w-5" /></Link> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <h1 className="text-2xl font-extrabold">Account Security</h1>
        </div>

        {panel === "menu" && (
          <div className="bg-white rounded-3xl shadow-md divide-y divide-black/5">
            {items.map(({ id, label, desc, Icon, color }) => (
              <button key={id} onClick={() => setPanel(id)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                <div className={`${color} rounded-2xl p-2.5 text-white`}><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="font-bold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
            ))}
          </div>
        )}

        {panel === "reset" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <h2 className="font-extrabold text-lg mb-4">Password Reset</h2>
            <label className="block text-sm font-bold mb-2">Phone number</label>
            <input value={vals.contact ?? ""} onChange={(e) => setV("contact", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="07XX XXX XXX" />
            {msg && <p className={`mb-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
            <button disabled={busy} onClick={handleResetPassword} className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-2xl py-4 font-bold disabled:opacity-60">Send Reset Link</button>
          </div>
        )}
        {panel === "fund" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <h2 className="font-extrabold text-lg mb-4">Fund Password</h2>
            <label className="block text-sm font-bold mb-2">New Fund Password (4-12 digits)</label>
            <input type="password" inputMode="numeric" value={vals.fund ?? ""} onChange={(e) => setV("fund", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="••••••" />
            <label className="block text-sm font-bold mb-2">Confirm</label>
            <input type="password" inputMode="numeric" value={vals.fund_confirm ?? ""} onChange={(e) => setV("fund_confirm", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="••••••" />
            {msg && <p className={`mb-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
            <button disabled={busy} onClick={handleFund} className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-2xl py-4 font-bold disabled:opacity-60">Save Fund Password</button>
          </div>
        )}
        {panel === "login" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <h2 className="font-extrabold text-lg mb-4">Login Password</h2>
            <p className="text-sm text-muted-foreground mb-4">Use "Change Login Password" to set a new sign-in password.</p>
            <button onClick={() => setPanel("change")} className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-2xl py-4 font-bold">Open Change Password</button>
          </div>
        )}
        {panel === "change" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <h2 className="font-extrabold text-lg mb-4">Change Login Password</h2>
            <label className="block text-sm font-bold mb-2">New Password</label>
            <input type="password" value={vals.new_password ?? ""} onChange={(e) => setV("new_password", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="••••••••" />
            <label className="block text-sm font-bold mb-2">Confirm</label>
            <input type="password" value={vals.confirm ?? ""} onChange={(e) => setV("confirm", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="••••••••" />
            {msg && <p className={`mb-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
            <button disabled={busy} onClick={handleChangePassword} className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-2xl py-4 font-bold disabled:opacity-60">Update Password</button>
          </div>
        )}
        {panel === "delete" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="bg-rose-100 rounded-2xl p-4 mb-4">
              <p className="text-rose-700 font-bold">Warning: This action is permanent</p>
              <p className="text-rose-700/80 text-sm mt-1">Deleting your account will erase all your earnings, packages, team data and CDK rewards. This cannot be undone.</p>
            </div>
            <label className="block text-sm font-bold mb-2">Type DELETE to confirm</label>
            <input value={vals.confirm_delete ?? ""} onChange={(e) => setV("confirm_delete", e.target.value)} className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="DELETE" />
            {msg && <p className={`mb-3 text-sm ${msg.kind === "err" ? "text-rose-600" : "text-emerald-600"}`}>{msg.text}</p>}
            <button disabled={busy} onClick={handleDelete} className="w-full bg-rose-500 text-white rounded-2xl py-4 font-bold disabled:opacity-60">Delete My Account</button>
          </div>
        )}
      </div>
    </Shell>
  );
}