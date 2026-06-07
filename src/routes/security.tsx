import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, RefreshCcw, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Account Security — Monvex" }] }),
  component: Security,
});

type Panel = "menu" | "reset" | "fund" | "login" | "change" | "delete";

function Security() {
  const [panel, setPanel] = useState<Panel>("menu");

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
          <Form title="Password Reset" fields={[{ label: "Email or Phone", type: "text", placeholder: "you@email.com" }]} cta="Send Reset Link" />
        )}
        {panel === "fund" && (
          <Form title="Fund Password" fields={[
            { label: "New Fund Password (6 digits)", type: "password", placeholder: "••••••" },
            { label: "Confirm Fund Password", type: "password", placeholder: "••••••" },
          ]} cta="Save Fund Password" />
        )}
        {panel === "login" && (
          <Form title="Login Password" fields={[{ label: "Current Password", type: "password", placeholder: "••••••••" }]} cta="Verify" />
        )}
        {panel === "change" && (
          <Form title="Change Login Password" fields={[
            { label: "Current Password", type: "password", placeholder: "••••••••" },
            { label: "New Password", type: "password", placeholder: "••••••••" },
            { label: "Confirm New Password", type: "password", placeholder: "••••••••" },
          ]} cta="Update Password" />
        )}
        {panel === "delete" && (
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="bg-rose-100 rounded-2xl p-4 mb-4">
              <p className="text-rose-700 font-bold">Warning: This action is permanent</p>
              <p className="text-rose-700/80 text-sm mt-1">Deleting your account will erase all your earnings, packages, team data and CDK rewards. This cannot be undone.</p>
            </div>
            <label className="block text-sm font-bold mb-2">Type DELETE to confirm</label>
            <input className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="DELETE" />
            <label className="block text-sm font-bold mb-2">Login Password</label>
            <input type="password" className="w-full bg-muted rounded-2xl px-4 py-3 mb-4" placeholder="••••••••" />
            <button className="w-full bg-rose-500 text-white rounded-2xl py-4 font-bold">Delete My Account</button>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Form({ title, fields, cta }: { title: string; fields: { label: string; type: string; placeholder: string }[]; cta: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <h2 className="font-extrabold text-lg mb-4">{title}</h2>
      {fields.map((f, i) => (
        <div key={i} className="mb-4">
          <label className="block text-sm font-bold mb-2">{f.label}</label>
          <input type={f.type} placeholder={f.placeholder} className="w-full bg-muted rounded-2xl px-4 py-3" />
        </div>
      ))}
      <button className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-2xl py-4 font-bold mt-2">{cta}</button>
    </div>
  );
}