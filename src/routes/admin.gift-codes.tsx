import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListGiftCodes, adminCreateGiftCode, adminToggleGiftCode, adminDeleteGiftCode } from "@/lib/admin.functions";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/gift-codes")({ component: GiftCodes });

function GiftCodes() {
  const list = useServerFn(adminListGiftCodes);
  const create = useServerFn(adminCreateGiftCode);
  const toggle = useServerFn(adminToggleGiftCode);
  const del = useServerFn(adminDeleteGiftCode);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-gift-codes"], queryFn: () => list() });

  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [max, setMax] = useState("1");
  const [err, setErr] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: () => create({ data: { code, amount: Number(amount), max_redemptions: Number(max) } }),
    onSuccess: () => { setCode(""); setAmount(""); setMax("1"); setErr(null); qc.invalidateQueries({ queryKey: ["admin-gift-codes"] }); },
    onError: (e: any) => setErr(e.message || "Failed"),
  });
  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => toggle({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-gift-codes"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-gift-codes"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gift Codes</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }}
        className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
      >
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="bg-slate-800 rounded-md px-3 py-2 text-sm font-mono uppercase" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount KES" type="number" className="bg-slate-800 rounded-md px-3 py-2 text-sm" />
        <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max uses" type="number" className="bg-slate-800 rounded-md px-3 py-2 text-sm" />
        <button disabled={createMut.isPending} className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-semibold flex items-center justify-center gap-1">
          {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
        </button>
        {err && <p className="sm:col-span-4 text-xs text-rose-400">{err}</p>}
      </form>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="text-left p-3">Code</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-right p-3">Uses</th>
                <th className="text-center p-3">Active</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.codes ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="p-3 font-mono">{c.code}</td>
                  <td className="p-3 text-right">KES {Number(c.amount).toLocaleString()}</td>
                  <td className="p-3 text-right">{c.used_count} / {c.max_redemptions}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })}
                      className={`text-xs font-bold px-2 py-1 rounded-full ${c.active ? "bg-emerald-600/20 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => delMut.mutate(c.id)} className="inline-flex items-center gap-1 rounded-md bg-rose-600/80 hover:bg-rose-500 px-2.5 py-1.5 text-xs font-semibold">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.codes?.length && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No gift codes yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}