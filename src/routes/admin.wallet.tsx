import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAdjustWallet, adminListUsers } from "@/lib/admin.functions";
import { useState } from "react";
import { Search, Loader2, Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/admin/wallet")({ component: WalletPage });

function WalletPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const list = useServerFn(adminListUsers);
  const adjust = useServerFn(adminAdjustWallet);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users-search", search],
    queryFn: () => list({ data: { search: search || undefined } }),
    enabled: search.length > 0,
  });

  const submit = async (sign: 1 | -1) => {
    if (!selected || !amount) return;
    setMsg(null);
    try {
      const res = await adjust({ data: { user_id: selected.id, amount: sign * Number(amount), note } });
      setMsg(`Done. New balance: KES ${Number(res.balance).toLocaleString()}`);
      setAmount(""); setNote("");
      qc.invalidateQueries({ queryKey: ["admin-users-search"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) { setMsg(e.message || "Failed"); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wallet Management</h1>
      <p className="text-sm text-slate-400">Search a user by phone or name, then credit or debit their balance.</p>

      <div className="flex items-center gap-2 rounded-lg bg-slate-900 ring-1 ring-slate-800 px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
          placeholder="Phone or name…"
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      {search && (
        <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800">
          {isLoading ? (
            <div className="py-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {data?.users.slice(0, 10).map((u: any) => (
                <li key={u.id}
                  onClick={() => setSelected(u)}
                  className={`p-3 cursor-pointer hover:bg-slate-800/50 flex items-center justify-between ${
                    selected?.id === u.id ? "bg-emerald-900/20" : ""
                  }`}>
                  <div>
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-slate-400 font-mono">{u.phone}</div>
                  </div>
                  <div className="text-sm font-semibold">KES {Number(u.balance).toLocaleString()}</div>
                </li>
              ))}
              {!data?.users.length && (
                <li className="p-6 text-center text-slate-500 text-sm">No matches</li>
              )}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5 space-y-4 max-w-xl">
          <div>
            <div className="text-xs uppercase text-slate-400">Selected user</div>
            <div className="font-semibold">{selected.full_name || "—"} • <span className="font-mono">{selected.phone}</span></div>
            <div className="text-sm text-slate-400">Current balance: <span className="text-white font-semibold">KES {Number(selected.balance).toLocaleString()}</span></div>
          </div>
          <div>
            <label className="text-xs uppercase text-slate-400">Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={0}
              className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs uppercase text-slate-400">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
              className="mt-1 w-full rounded-lg bg-slate-950 ring-1 ring-slate-800 px-3 py-2 outline-none focus:ring-emerald-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => submit(1)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold">
              <Plus className="h-4 w-4" /> Credit
            </button>
            <button onClick={() => submit(-1)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 font-semibold">
              <Minus className="h-4 w-4" /> Debit
            </button>
          </div>
          {msg && <p className="text-sm text-slate-300">{msg}</p>}
        </div>
      )}
    </div>
  );
}