import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGetSettings, adminUpdateSettings } from "@/lib/admin.functions";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-700"}`}>
        <span className={`inline-block h-4 w-4 bg-white rounded-full transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

function SettingsPage() {
  const get = useServerFn(adminGetSettings);
  const update = useServerFn(adminUpdateSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get() });
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (data?.settings) setForm(data.settings); }, [data]);

  if (isLoading || !form) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await update({ data: {
        withdrawals_enabled: form.withdrawals_enabled,
        tasks_enabled: form.tasks_enabled,
        registrations_enabled: form.registrations_enabled,
        maintenance_mode: form.maintenance_mode,
        min_deposit: Number(form.min_deposit),
        min_withdrawal: Number(form.min_withdrawal),
        payment_paybill: form.payment_paybill ?? "",
        payment_account: form.payment_account ?? "",
        payment_instructions: form.payment_instructions ?? "",
        whatsapp_url: form.whatsapp_url ?? "",
        telegram_url: form.telegram_url ?? "",
      } });
      setMsg("Saved");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (e: any) { setMsg(e.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Site Settings</h1>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 divide-y divide-slate-800">
        <Toggle label="Withdrawals enabled" hint="Allow users to request withdrawals."
          checked={form.withdrawals_enabled} onChange={(v) => setForm({ ...form, withdrawals_enabled: v })} />
        <Toggle label="Tasks enabled" hint="Allow users to perform daily tasks."
          checked={form.tasks_enabled} onChange={(v) => setForm({ ...form, tasks_enabled: v })} />
        <Toggle label="New registrations" hint="Allow new accounts to be created."
          checked={form.registrations_enabled} onChange={(v) => setForm({ ...form, registrations_enabled: v })} />
        <Toggle label="Maintenance mode" hint="Put the entire site into maintenance mode."
          checked={form.maintenance_mode} onChange={(v) => setForm({ ...form, maintenance_mode: v })} />
      </div>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 space-y-4">
        <h2 className="font-semibold">Deposit & withdrawal limits</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-xs text-slate-400">Minimum deposit (KES)</span>
            <input type="number" value={form.min_deposit}
              onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
          </label>
          <label>
            <span className="text-xs text-slate-400">Minimum withdrawal (KES)</span>
            <input type="number" value={form.min_withdrawal}
              onChange={(e) => setForm({ ...form, min_withdrawal: e.target.value })}
              className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 space-y-3">
        <h2 className="font-semibold">Manual deposit (M-Pesa) details</h2>
        <label className="block">
          <span className="text-xs text-slate-400">Pay Bill / Business number</span>
          <input value={form.payment_paybill ?? ""} onChange={(e) => setForm({ ...form, payment_paybill: e.target.value })}
            className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Account number</span>
          <input value={form.payment_account ?? ""} onChange={(e) => setForm({ ...form, payment_account: e.target.value })}
            className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Payment instructions</span>
          <textarea rows={3} value={form.payment_instructions ?? ""} onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
            className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500 text-sm" />
        </label>
      </div>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 space-y-3">
        <h2 className="font-semibold">Community links</h2>
        <label className="block">
          <span className="text-xs text-slate-400">WhatsApp group URL</span>
          <input value={form.whatsapp_url ?? ""} onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })}
            placeholder="https://chat.whatsapp.com/..."
            className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Telegram group URL</span>
          <input value={form.telegram_url ?? ""} onChange={(e) => setForm({ ...form, telegram_url: e.target.value })}
            placeholder="https://t.me/..."
            className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 font-semibold disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
        <p className="text-xs text-slate-500 ml-auto">Per-user withdrawal toggles are on the Users page.</p>
      </div>
    </div>
  );
}