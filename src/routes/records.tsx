import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Users, Gift, ListOrdered } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyTransactions } from "@/lib/monvex.functions";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "Financial Records — Monvex" }] }),
  component: Records,
});

const tabs = [
  { id: "all", label: "All", Icon: ListOrdered, color: "bg-slate-800", type: undefined as undefined },
  { id: "deposit", label: "Deposit", Icon: ArrowDownToLine, color: "bg-emerald-500", type: "deposit" as const },
  { id: "withdrawal", label: "Withdrawal", Icon: ArrowUpFromLine, color: "bg-rose-500", type: "withdrawal" as const },
  { id: "referral", label: "Referral Rebate", Icon: Users, color: "bg-sky-500", type: "rebate" as const },
  { id: "cdk", label: "Gift CDK Reward", Icon: Gift, color: "bg-amber-500", type: "gift" as const },
] as const;

function Records() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const active = tabs.find((t) => t.id === tab)!;
  const fn = useServerFn(listMyTransactions);
  const { data } = useQuery({
    queryKey: ["transactions", active.type],
    queryFn: () => fn({ data: active.type ? { type: active.type } : {} }),
  });
  const list = data?.rows ?? [];
  const total = list.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  function statusLabel(row: any) {
    if (row.type === "withdrawal") {
      if (row.status === "pending") return { text: "Waiting", cls: "bg-rose-100 text-rose-700" };
      if (row.status === "success") return { text: "Paid", cls: "bg-blue-100 text-blue-700" };
      return { text: row.status, cls: "bg-slate-100 text-slate-700" };
    }
    if (row.status === "success") return { text: "Success", cls: "bg-emerald-100 text-emerald-700" };
    if (row.status === "pending") return { text: "Pending", cls: "bg-amber-100 text-amber-700" };
    return { text: row.status, cls: "bg-rose-100 text-rose-700" };
  }

  return (
    <Shell>
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/profile" className="rounded-full bg-white p-2 shadow"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-extrabold">Financial Records</h1>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {tabs.map(({ id, label, Icon, color }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-2xl p-3 text-white text-[10px] font-bold flex flex-col items-center gap-1 shadow-md ${color} ${tab === id ? "ring-4 ring-black/10 scale-[1.02]" : "opacity-80"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] rounded-3xl p-5 text-white shadow-lg">
          <p className="text-xs tracking-widest opacity-80">TOTAL {tabs.find(t => t.id === tab)?.label.toUpperCase()}</p>
          <p className="text-3xl font-extrabold mt-1">KES {total.toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-1">{list.length} transaction{list.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="mt-4 bg-white rounded-3xl shadow-md divide-y divide-black/5">
          {list.map((t, i) => {
            const s = statusLabel(t);
            return (
            <div key={t.id ?? i} className="px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">{t.type}</span>
                  KES {Math.abs(Number(t.amount)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{t.description ?? t.reference ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(t.created_at).toLocaleString()}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${s.cls}`}>
                {s.text}
              </span>
            </div>
          );})}
          {list.length === 0 && <p className="px-5 py-6 text-center text-muted-foreground text-sm">No records yet.</p>}
        </div>
      </div>
    </Shell>
  );
}