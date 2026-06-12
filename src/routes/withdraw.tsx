import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Smartphone, Loader2, CheckCircle2, Wallet, Clock, Percent, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createWithdrawal } from "@/lib/monvex.functions";
import { useMe } from "@/hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Monvex" },
      { name: "description", content: "Withdraw funds to M-Pesa." },
    ],
  }),
  component: WithdrawPage,
});

const MIN = 100;

type Step = "form" | "processing" | "success";

function WithdrawPage() {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const BALANCE = Number(me?.profile?.balance ?? 0);
  const hasWithdrawn = !!(me?.profile as any)?.has_withdrawn;
  const withdraw = useServerFn(createWithdrawal);
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValidPhone = (p: string) => /^(?:254|0)?(?:7|1)\d{8}$/.test(p.replace(/\D/g, ""));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (hasWithdrawn) { setError("You have already used your one-time withdrawal."); return; }
    if (!isValidPhone(phone)) {
      setError("Enter a valid Safaricom number, e.g. 0712345678");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < MIN) {
      setError(`Minimum withdrawal is KES ${MIN}`);
      return;
    }
    if (amt > BALANCE) {
      setError(`Insufficient balance. Available: KES ${BALANCE}`);
      return;
    }
    setStep("processing");
    try {
      await withdraw({ data: { mpesa_number: phone, amount: amt } });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setTimeout(() => setStep("success"), 1800);
    } catch (err: any) {
      setError(err.message || "Withdrawal failed");
      setStep("form");
    }
  };

  const amtNum = Number(amount) || 0;
  const tax = Math.round(amtNum * 0.10 * 100) / 100;
  const net = amtNum - tax;

  return (
    <Shell bg="bg-slate-50">
      <div className="relative px-5 pt-10 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700" />
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-white/70">Cash out to M-Pesa</p>
            <h1 className="text-lg font-bold">Withdraw Funds</h1>
          </div>
        </div>
        <div className="relative mt-5 rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span className="text-sm text-white/80">Available</span>
          </div>
          <span className="text-lg font-bold">KES {BALANCE.toLocaleString()}</span>
        </div>
      </div>

      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-xl ring-1 ring-black/5">
          {step === "form" && (
            <form onSubmit={submit} className="space-y-4">
              <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-100 p-3 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-semibold"><Clock className="h-3.5 w-3.5" /> Mon–Fri 9:00 AM – 5:00 PM · Sat 9:00 AM – 2:00 PM (EAT)</div>
                <div className="flex items-center gap-2 font-semibold"><Percent className="h-3.5 w-3.5" /> 10% tax fee deducted from every withdrawal</div>
                <div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-3.5 w-3.5" /> One withdrawal per account</div>
              </div>
              {hasWithdrawn && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl p-3">You've already used your one-time withdrawal.</p>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">M-Pesa Number</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 focus-within:border-rose-500">
                  <Smartphone className="h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="07XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={13}
                    className="flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (KES)</label>
                  <span className="text-[10px] text-slate-400">Min KES {MIN}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 focus-within:border-rose-500">
                  <span className="text-slate-500 font-semibold">KES</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={MIN}
                    max={BALANCE}
                    className="flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[100, 200, 327].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className="flex-1 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 py-1.5"
                    >
                      {q === BALANCE ? "Max" : q}
                    </button>
                  ))}
                </div>
              </div>

              {amtNum >= MIN && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Gross amount</span><span className="font-semibold">KES {amtNum.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">10% tax</span><span className="font-semibold text-rose-600">- KES {tax.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-1 border-t border-slate-200"><span className="font-bold">You receive</span><span className="font-extrabold text-emerald-600">KES {net.toLocaleString()}</span></div>
                </div>
              )}

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={hasWithdrawn}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold py-3.5 shadow-lg"
              >
                Withdraw to M-Pesa
              </button>
            </form>
          )}

          {step === "processing" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-rose-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Processing withdrawal</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Sending KES {amount} to <span className="font-semibold text-slate-700">{phone}</span>…
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Withdrawal sent</h2>
                <p className="text-sm text-slate-500 mt-1">
                  KES {amount} is on its way to {phone}. You'll receive an M-Pesa confirmation shortly.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/" })}
                className="w-full rounded-2xl bg-slate-900 text-white font-semibold py-3.5"
              >
                Back to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
