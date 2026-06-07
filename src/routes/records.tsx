import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Users, Gift } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "Financial Records — Monvex" }] }),
  component: Records,
});

type Tx = { date: string; amount: number; status: "Completed" | "Pending" | "Failed"; note?: string };

const data: Record<string, Tx[]> = {
  deposit: [
    { date: "2026-06-05 09:14", amount: 1800, status: "Completed", note: "M-Pesa STK" },
    { date: "2026-05-28 17:42", amount: 800, status: "Completed", note: "M-Pesa STK" },
  ],
  withdrawal: [
    { date: "2026-06-04 12:03", amount: 500, status: "Completed", note: "To 07XX•••321" },
    { date: "2026-05-30 08:21", amount: 200, status: "Pending", note: "To 07XX•••321" },
  ],
  referral: [
    { date: "2026-06-06 10:00", amount: 96, status: "Completed", note: "Level 1 rebate (12%)" },
    { date: "2026-06-02 14:11", amount: 24, status: "Completed", note: "Level 2 rebate (3%)" },
    { date: "2026-05-29 19:30", amount: 8, status: "Completed", note: "Level 3 rebate (1%)" },
  ],
  cdk: [
    { date: "2026-06-01 11:20", amount: 50, status: "Completed", note: "Gift CDK redeemed" },
    { date: "2026-05-25 09:45", amount: 100, status: "Completed", note: "Promo CDK" },
  ],
};

const tabs = [
  { id: "deposit", label: "Deposit", Icon: ArrowDownToLine, color: "bg-emerald-500" },
  { id: "withdrawal", label: "Withdrawal", Icon: ArrowUpFromLine, color: "bg-rose-500" },
  { id: "referral", label: "Referral Rebate", Icon: Users, color: "bg-sky-500" },
  { id: "cdk", label: "Gift CDK Reward", Icon: Gift, color: "bg-amber-500" },
] as const;

function Records() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("deposit");
  const list = data[tab];
  const total = list.reduce((s, t) => s + t.amount, 0);

  return (
    <Shell>
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/profile" className="rounded-full bg-white p-2 shadow"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-extrabold">Financial Records</h1>
        </div>

        <div className="grid grid-cols-4 gap-2">
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
          {list.map((t, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold">KES {t.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t.note}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.date}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${t.status === "Completed" ? "bg-emerald-100 text-emerald-700" : t.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                {t.status}
              </span>
            </div>
          ))}
          {list.length === 0 && <p className="px-5 py-6 text-center text-muted-foreground text-sm">No records yet.</p>}
        </div>
      </div>
    </Shell>
  );
}