import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCatalog, listMyPackages, purchasePackage } from "@/lib/monvex.functions";
import { useMe } from "@/hooks/useMe";
import { useState } from "react";

export const Route = createFileRoute("/packages")({
  head: () => ({ meta: [{ title: "Packages — Monvex" }, { name: "description", content: "Investment plans on Monvex." }] }),
  component: Packages,
});

function Packages() {
  const { data: me } = useMe();
  const catalogFn = useServerFn(listCatalog);
  const myFn = useServerFn(listMyPackages);
  const buyFn = useServerFn(purchasePackage);
  const qc = useQueryClient();
  const { data: catData } = useQuery({ queryKey: ["catalog"], queryFn: () => catalogFn() });
  const { data: myData } = useQuery({ queryKey: ["my-packages"], queryFn: () => myFn() });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const plans = catData?.catalog ?? [];
  const owned = (myData?.packages ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.package_code] = (acc[p.package_code] ?? 0) + 1;
    return acc;
  }, {});
  const balance = Number(me?.profile?.balance ?? 0);

  async function buy(code: string) {
    setErr(null);
    setBusy(code);
    try {
      await buyFn({ data: { code } });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["my-packages"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      setErr(e.message || "Activation failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell>
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-extrabold">Investment Plans</h1>
        <div className="mt-5 bg-[#fff8dc] rounded-3xl p-6 text-center shadow-md">
          <p className="text-sm tracking-wide text-muted-foreground">AVAILABLE FOR INVESTMENT</p>
          <p className="text-4xl font-extrabold mt-2">{balance.toFixed(2)} <span className="text-[#f5c518] text-xl">KSH</span></p>
        </div>
        {err && <p className="mt-3 text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{err}</p>}
        <div className="mt-6 space-y-5">
          {plans.map((p) => (
            <div key={p.code} className="bg-white rounded-3xl p-5 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full">{p.code}</span>
                  <p className="text-2xl font-extrabold mt-2">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-widest text-muted-foreground">OWNED</p>
                  <p className="text-xl font-bold text-emerald-500">{owned[p.code] ?? 0}<span className="text-sm text-muted-foreground">/2</span></p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">PRICE</p>
                  <p className="font-bold">{Number(p.deposit).toLocaleString()}</p>
                </div>
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">DAILY</p>
                  <p className="font-bold text-emerald-500">{Number(p.daily_income).toLocaleString()}</p>
                </div>
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">TOTAL</p>
                  <p className="font-bold text-[#2456a6]">{Number(p.total_return).toLocaleString()}</p>
                </div>
              </div>
              <button
                disabled={busy === p.code || balance < Number(p.deposit) || (owned[p.code] ?? 0) >= 2}
                onClick={() => buy(p.code)}
                className="mt-5 w-full bg-[#f5c518] rounded-full py-4 font-extrabold tracking-widest disabled:opacity-50"
              >
                {busy === p.code ? "ACTIVATING…" : (owned[p.code] ?? 0) >= 2 ? "MAX 2 PURCHASES REACHED" : balance < Number(p.deposit) ? "INSUFFICIENT BALANCE" : "ACTIVATE NOW"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}