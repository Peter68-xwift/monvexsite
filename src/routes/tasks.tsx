import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Zap, Lock, CheckCircle2, Loader2, Gift } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyPackages, claimDailyIncome } from "@/lib/monvex.functions";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Monvex" }, { name: "description", content: "Daily revenue tasks on Monvex." }] }),
  component: Tasks,
});

function Tasks() {
  const myFn = useServerFn(listMyPackages);
  const claimFn = useServerFn(claimDailyIncome);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-packages"], queryFn: () => myFn() });
  const packages = (data?.packages ?? []) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credited, setCredited] = useState<number | null>(null);

  const active = packages.filter((p) => p.status === "active");
  const pendingPkgs = active.filter((p) => p.last_claimed_at !== today);
  const pendingTotal = pendingPkgs.reduce((s, p) => s + Number(p.packages_catalog?.daily_income ?? 0), 0);
  const alreadyClaimed = active.length > 0 && pendingPkgs.length === 0;

  async function claim() {
    setError(null);
    setBusy(true);
    try {
      const res = await claimFn();
      setCredited(res.amount);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["my-packages"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      setError(e.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="px-4 pt-6">
        <div className="bg-[#fff8dc] rounded-3xl p-4 flex items-center gap-4 shadow-md">
          <div className="h-14 w-14 rounded-full bg-[#f5c518] flex items-center justify-center">
            <Zap className="h-7 w-7 text-black" />
          </div>
          <div>
            <p className="text-xs tracking-widest text-muted-foreground">CURRENT SESSION</p>
            <p className="text-xl font-bold">Daily Revenue Portal</p>
          </div>
        </div>

        {credited !== null && (
          <div className="mt-5 bg-emerald-50 ring-1 ring-emerald-200 rounded-3xl p-5 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Claimed KES {credited.toLocaleString()}</p>
              <p className="text-xs text-emerald-700">Come back tomorrow for your next daily income.</p>
            </div>
          </div>
        )}

        {!isLoading && active.length === 0 && (
          <div className="mt-6 bg-white rounded-3xl p-6 text-center shadow-md space-y-3">
            <Gift className="h-10 w-10 text-[#f5c518] mx-auto" />
            <p className="font-bold">No active package yet</p>
            <p className="text-xs text-muted-foreground">Purchase a package to start earning daily income.</p>
            <Link to="/packages" className="inline-block bg-black text-white rounded-full px-5 py-2 text-sm font-semibold">Browse Packages</Link>
          </div>
        )}

        {active.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs tracking-widest text-muted-foreground">TODAY'S CLAIMABLE INCOME</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alreadyClaimed ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>
                {alreadyClaimed ? "CLAIMED" : "READY"}
              </span>
            </div>
            <p className="text-4xl font-extrabold">{pendingTotal.toLocaleString()} <span className="text-[#f5c518] text-base">KSH</span></p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              disabled={busy || alreadyClaimed || pendingTotal <= 0}
              onClick={claim}
              className="w-full bg-[#f5c518] rounded-full py-4 font-extrabold tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : alreadyClaimed ? <><Lock className="h-4 w-4" /> COME BACK TOMORROW</> : "CLAIM DAILY INCOME"}
            </button>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {active.map((p: any) => {
            const claimed = p.last_claimed_at === today;
            return (
              <div key={p.id} className="bg-[#f0d97a]/70 rounded-3xl p-5 shadow-md">
                <div className="flex justify-between items-start">
                  <span className="inline-block bg-[#b89d3c]/70 text-[#5a4a14] text-xs font-bold px-4 py-2 rounded-full">{p.package_code} · {p.packages_catalog?.name ?? ""}</span>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-[#7a6420]">{Number(p.packages_catalog?.daily_income ?? 0).toLocaleString()}<span className="text-xs align-top ml-1">KSH</span></p>
                    <p className="text-xs font-bold tracking-widest text-[#7a6420]">DAILY RETURN</p>
                  </div>
                </div>
                <p className="mt-3 text-xl font-extrabold text-[#5a4a14]">Total earned: KES {Number(p.total_earned ?? 0).toLocaleString()}</p>
                <p className="text-xs tracking-widest text-[#7a6420]/70 mt-1">EXPIRES {new Date(p.expires_at).toLocaleDateString()}</p>
                <div className={`mt-4 rounded-full py-3 flex items-center justify-center gap-2 font-bold tracking-widest text-sm ${claimed ? "bg-[#e6cc66]/60 text-[#7a6420]" : "bg-emerald-600 text-white"}`}>
                  {claimed ? <><Lock className="h-4 w-4" /> CLAIMED TODAY</> : <><CheckCircle2 className="h-4 w-4" /> READY TO CLAIM</>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}