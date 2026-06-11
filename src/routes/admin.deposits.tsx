import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListPendingDeposits, adminDecideDeposit } from "@/lib/admin.functions";
import { Check, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/admin/deposits")({ component: DepositsPage });

function DepositsPage() {
  const list = useServerFn(adminListPendingDeposits);
  const decide = useServerFn(adminDecideDeposit);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-deposits"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (vars: { tx_id: string; decision: "approve" | "reject" }) => decide({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-deposits"] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending Manual Deposits</h1>
      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">M-Pesa Message</th>
                <th className="text-left p-3">Submitted</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((r: any) => (
                <tr key={r.id} className="border-t border-slate-800 align-top">
                  <td className="p-3">
                    <div className="font-medium">{r.profile?.full_name || "—"}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.profile?.phone}</div>
                  </td>
                  <td className="p-3 text-right font-semibold">KES {Number(r.amount).toLocaleString()}</td>
                  <td className="p-3 text-slate-300 max-w-md whitespace-pre-wrap break-words text-xs">{r.mpesa_message || "—"}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <button disabled={mut.isPending} onClick={() => mut.mutate({ tx_id: r.id, decision: "approve" })} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button disabled={mut.isPending} onClick={() => mut.mutate({ tx_id: r.id, decision: "reject" })} className="inline-flex items-center gap-1 rounded-md bg-rose-600 hover:bg-rose-500 px-2.5 py-1.5 text-xs font-semibold">
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.rows.length && (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No pending manual deposits</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}