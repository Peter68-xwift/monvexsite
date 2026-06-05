import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Smartphone, Loader2, CheckCircle2, Wallet } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Monvex" },
      { name: "description", content: "Withdraw funds to M-Pesa." },
    ],
  }),
  component: WithdrawPage,
});

const BALANCE = 327;
const MIN = 100;

type Step = "form" | "processing" | "success";

function WithdrawPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValidPhone = (p: string) => /^(?:254|0)?(?:7|1)\d{8}$/.test(p.replace(/\D/g, ""));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
    setTimeout(() => setStep("success"), 2500);
  };

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

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
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
