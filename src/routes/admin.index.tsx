import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/admin.functions";
import { StatCard } from "@/components/AdminGuard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function fmt(n: number) {
  return "KES " + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function AdminDashboard() {
  const fn = useServerFn(adminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">Live metrics across your platform.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's Profit" value={fmt(data.profitToday)} accent="text-emerald-400" />
        <StatCard label="Today's Loss" value={fmt(data.lossToday)} accent="text-rose-400" />
        <StatCard label="Money In Today" value={fmt(data.moneyInToday)} accent="text-emerald-300" />
        <StatCard label="Money Out Today" value={fmt(data.moneyOutToday)} accent="text-amber-300" />
        <StatCard label="Today's Payments" value={data.paymentsToday} />
        <StatCard label="Total Members" value={data.totalMembers} />
        <StatCard label="Active Users" value={data.activeUsers} />
        <StatCard label="Total Purchases" value={fmt(data.totalPurchases)} />
        <StatCard label="Cash Balance" value={fmt(data.cashBalance)} />
        <StatCard label="System Liability" value={fmt(data.liability)} accent="text-orange-300" />
      </div>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-5">
        <h2 className="text-base font-semibold mb-3">Package Purchases</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left py-2">Code</th>
              <th className="text-left py-2">Name</th>
              <th className="text-right py-2">Purchases</th>
              <th className="text-right py-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data.packageBreakdown.map((p) => (
              <tr key={p.code} className="border-t border-slate-800">
                <td className="py-2 font-mono">{p.code}</td>
                <td className="py-2">{p.name}</td>
                <td className="py-2 text-right">{p.count}</td>
                <td className="py-2 text-right">{fmt(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}