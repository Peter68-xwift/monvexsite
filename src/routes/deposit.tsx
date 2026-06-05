import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Smartphone, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — Monvex" },
      { name: "description", content: "Deposit funds via M-Pesa STK push." },
    ],
  }),
  component: DepositPage,
});

type Step = "form" | "prompt" | "success";

function DepositPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalize = (p: string) => p.replace(/\D/g, "");

  const isValidPhone = (p: string) => {
    const n = normalize(p);
    return /^(?:254|0)?(?:7|1)\d{8}$/.test(n);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidPhone(phone)) {
      setError("Enter a valid Safaricom number, e.g. 0712345678");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt < 10) {
      setError("Minimum deposit is KES 10");
      return;
    }
    setStep("prompt");
    // Simulated STK push wait
    setTimeout(() => setStep("success"), 4000);
  };

  return (
    <Shell bg="bg-slate-50">
      <div className="relative px-5 pt-10 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700" />
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-white/70">Top up your account</p>
            <h1 className="text-lg font-bold">Deposit via M-Pesa</h1>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-xl ring-1 ring-black/5">
          {step === "form" && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">M-Pesa Number</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 focus-within:border-emerald-500">
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount (KES)</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 focus-within:border-emerald-500">
                  <span className="text-slate-500 font-semibold">KES</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={10}
                    className="flex-1 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[100, 500, 1000, 2000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className="flex-1 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 py-1.5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-emerald-50 rounded-xl p-3">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>You'll receive an M-Pesa prompt on your phone. Enter your PIN to confirm.</span>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3.5 shadow-lg"
              >
                Send STK Push
              </button>
            </form>
          )}

          {step === "prompt" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Check your phone</h2>
                <p className="text-sm text-slate-500 mt-1">
                  We sent an M-Pesa prompt to <span className="font-semibold text-slate-700">{phone}</span>. Enter your M-Pesa PIN to deposit <span className="font-semibold text-slate-700">KES {amount}</span>.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                Waiting for confirmation… Don't close this page.
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Deposit successful</h2>
                <p className="text-sm text-slate-500 mt-1">KES {amount} was added to your wallet.</p>
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
