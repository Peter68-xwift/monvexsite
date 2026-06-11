import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Gift, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { redeemGiftCode } from "@/lib/monvex.functions";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/gift")({
  head: () => ({ meta: [{ title: "Gift Code — Monvex" }, { name: "description", content: "Redeem your Monvex gift code." }] }),
  component: GiftPage,
});

function GiftPage() {
  const fn = useServerFn(redeemGiftCode);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fn({ data: { code } });
      setSuccess(res.amount);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    } catch (e: any) {
      setError(e.message || "Could not redeem this code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell bg="bg-slate-50">
      <div className="relative px-5 pt-10 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600" />
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-white/70">Redeem rewards</p>
            <h1 className="text-lg font-bold">Gift Code</h1>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl p-6 shadow-xl ring-1 ring-black/5">
          {success !== null ? (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Code redeemed!</h2>
              <p className="text-sm text-slate-500">KES {success.toLocaleString()} has been added to your wallet.</p>
              <button onClick={() => { setSuccess(null); setCode(""); }} className="w-full rounded-2xl bg-slate-900 text-white font-semibold py-3.5">
                Redeem another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-fuchsia-100 flex items-center justify-center">
                <Gift className="h-7 w-7 text-fuchsia-600" />
              </div>
              <p className="text-center text-sm text-slate-500">Enter your gift code below to claim and exchange it for wallet credit.</p>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none focus:border-fuchsia-500"
                  placeholder="ABCD-1234"
                  maxLength={40}
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={busy || !code.trim()}
                className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-semibold py-3.5 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Redeem Code
              </button>
            </form>
          )}
        </div>
      </div>
    </Shell>
  );
}