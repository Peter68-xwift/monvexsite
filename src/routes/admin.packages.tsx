import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDeletePackage, adminUpsertPackage } from "@/lib/admin.functions";
import { listCatalog } from "@/lib/monvex.functions";
import { useState } from "react";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/packages")({ component: PackagesPage });

type Form = {
  code: string; name: string; deposit: string; daily_income: string;
  duration_days: string; total_return: string; sort_order: string;
};
const empty: Form = { code: "", name: "", deposit: "", daily_income: "", duration_days: "30", total_return: "", sort_order: "0" };

function PackagesPage() {
  const list = useServerFn(listCatalog);
  const save = useServerFn(adminUpsertPackage);
  const del = useServerFn(adminDeletePackage);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["catalog"], queryFn: () => list() });
  const [form, setForm] = useState<Form>(empty);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const edit = (p: any) => {
    setEditing(true);
    setForm({
      code: p.code, name: p.name, deposit: String(p.deposit), daily_income: String(p.daily_income),
      duration_days: String(p.duration_days), total_return: String(p.total_return), sort_order: String(p.sort_order),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await save({ data: {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        deposit: Number(form.deposit),
        daily_income: Number(form.daily_income),
        duration_days: Number(form.duration_days),
        total_return: Number(form.total_return),
        sort_order: Number(form.sort_order),
      } });
      setForm(empty); setEditing(false);
      qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e: any) { setErr(e.message || "Failed"); }
  };

  const remove = async (code: string) => {
    if (!confirm(`Delete package ${code}?`)) return;
    await del({ data: { code } });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Packages</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5">
          <h2 className="font-semibold mb-3">{editing ? "Edit package" : "Add new package"}</h2>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3 text-sm">
            {([
              ["code", "Code (e.g. C1)", "text"],
              ["name", "Name", "text"],
              ["deposit", "Deposit (KES)", "number"],
              ["daily_income", "Daily Income (KES)", "number"],
              ["duration_days", "Duration (days)", "number"],
              ["total_return", "Total Return (KES)", "number"],
              ["sort_order", "Sort Order", "number"],
            ] as const).map(([k, label, type]) => (
              <label key={k} className={k === "name" ? "col-span-2" : ""}>
                <span className="text-xs text-slate-400">{label}</span>
                <input type={type} required value={(form as any)[k]} disabled={editing && k === "code"}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500 disabled:opacity-60" />
              </label>
            ))}
            {err && <p className="col-span-2 text-sm text-rose-400">{err}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold">
                <Plus className="h-4 w-4" /> {editing ? "Save changes" : "Add package"}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(false); setForm(empty); }}
                  className="rounded-lg bg-slate-800 px-4 font-semibold">Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5">
          <h2 className="font-semibold mb-3">Existing packages</h2>
          {isLoading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {data?.catalog.map((p: any) => (
                <li key={p.code} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.code} — {p.name}</div>
                    <div className="text-xs text-slate-400">
                      Deposit KES {Number(p.deposit).toLocaleString()} • Daily KES {Number(p.daily_income).toLocaleString()} • {p.duration_days}d
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => edit(p)} className="rounded-md bg-slate-800 hover:bg-slate-700 p-2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => remove(p.code)} className="rounded-md bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 p-2"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
              {!data?.catalog.length && <li className="py-6 text-center text-slate-500 text-sm">No packages yet</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}