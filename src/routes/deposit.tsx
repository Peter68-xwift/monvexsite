import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Smartphone, ShieldCheck, Loader2, CheckCircle2, Copy, Check, ClipboardPaste } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createDeposit, getDepositStatus, createManualDeposit, getPublicSettings } from "@/lib/monvex.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
type Tab = "stk" | "manual";

function DepositPage() {
  const navigate = useNavigate();
  const deposit = useServerFn(createDeposit);
  const checkStatus = useServerFn(getDepositStatus);
  const manualFn = useServerFn(createManualDeposit);
  const settingsFn = useServerFn(getPublicSettings);
  const { data: settingsData } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });
  const settings = settingsData?.settings as any;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("stk");
  const [step, setStep] = useState<Step>("form");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  // manual
  const [mAmount, setMAmount] = useState("");
  const [mMessage, setMMessage] = useState("");
  const [mBusy, setMBusy] = useState(false);
  const [mDone, setMDone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const normalize = (p: string) => p.replace(/\D/g, "");

  const isValidPhone = (p: string) => {
    const n = normalize(p);
    return /^(?:254|0)?(?:7|1)\d{8}$/.test(n);
  };

  const submit = async (e: React.FormEvent) => {
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
    try {
      const res = await deposit({ data: { mpesa_number: phone, amount: amt } });
      const checkoutId = res.checkout_request_id;
      // Poll for confirmation up to ~90s
      const started = Date.now();
      const poll = async () => {
        try {
          const { tx } = await checkStatus({ data: { checkout_request_id: checkoutId } });
          if (tx?.status === "success") {
            qc.invalidateQueries({ queryKey: ["me"] });
            qc.invalidateQueries({ queryKey: ["transactions"] });
            setStep("success");
            return;
          }
          if (tx?.status === "failed") {
            setError(tx.description || "Payment was cancelled or failed");
            setStep("form");
            return;
          }
          if (Date.now() - started > 90_000) {
            setError("Timed out waiting for confirmation. If you paid, it will reflect shortly.");
            setStep("form");
            return;
          }
          setTimeout(poll, 3000);
        } catch {
          setTimeout(poll, 4000);
        }
      };
      setTimeout(poll, 4000);
    } catch (err: any) {
      setError(err.message || "Deposit failed");
      setStep("form");
    }
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
            <h1 className="text-lg font-bold">Deposit Funds</h1>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-xl ring-1 ring-black/5">
          <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 text-sm font-semibold mb-4">
            <button type="button" onClick={() => setTab("stk")} className={`py-2 rounded-lg transition ${tab === "stk" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>STK Push</button>
            <button type="button" onClick={() => setTab("manual")} className={`py-2 rounded-lg transition ${tab === "manual" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>Manual M-Pesa</button>
          </div>

          {tab === "stk" && <>
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
          </>}

          {tab === "manual" && (
            mDone ? (
              <div className="py-4 text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <ClipboardPaste className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Submitted for approval</h2>
                <p className="text-sm text-slate-500">Your deposit will reflect on your wallet once an admin verifies your M-Pesa message. This usually takes a few minutes.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setMDone(false); setMAmount(""); setMMessage(""); }} className="rounded-2xl bg-slate-100 font-semibold py-3">Submit another</button>
                  <button onClick={() => navigate({ to: "/" })} className="rounded-2xl bg-slate-900 text-white font-semibold py-3">Back home</button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const amt = Number(mAmount);
                  if (!amt || amt < 10) { setError("Enter a valid amount (min KES 10)"); return; }
                  if (mMessage.trim().length < 10) { setError("Paste the full M-Pesa confirmation message"); return; }
                  setMBusy(true);
                  try {
                    await manualFn({ data: { amount: amt, mpesa_message: mMessage.trim() } });
                    qc.invalidateQueries({ queryKey: ["transactions"] });
                    setMDone(true);
                  } catch (err: any) {
                    setError(err.message || "Submission failed");
                  } finally {
                    setMBusy(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-700">Payment Details</p>
                  <Detail label="Pay Bill / Business No." value={settings?.payment_paybill || "—"} onCopy={() => copy(settings?.payment_paybill || "", "paybill")} copied={copied === "paybill"} />
                  <Detail label="Account Number" value={settings?.payment_account || "—"} onCopy={() => copy(settings?.payment_account || "", "account")} copied={copied === "account"} />
                  <p className="text-xs text-slate-600 leading-relaxed">{settings?.payment_instructions || "Pay via M-Pesa using the details above, then paste the confirmation SMS below."}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid (KES)</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 focus-within:border-emerald-500">
                    <span className="text-slate-500 font-semibold">KES</span>
                    <input type="number" inputMode="numeric" value={mAmount} onChange={(e) => setMAmount(e.target.value)} min={10} placeholder="500" className="flex-1 outline-none bg-transparent" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paste M-Pesa Confirmation Message</label>
                  <textarea
                    value={mMessage}
                    onChange={(e) => setMMessage(e.target.value)}
                    rows={4}
                    placeholder="e.g. ABC1234XYZ Confirmed. Ksh500.00 sent to MONVEX 522522 Account MX001 on 11/6/26..."
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                {error && <p className="text-sm text-rose-600">{error}</p>}

                <button type="submit" disabled={mBusy} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3.5 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                  {mBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  I have paid
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </Shell>
  );
}

function Detail({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2 ring-1 ring-emerald-100">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        <p className="font-mono text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
      <button type="button" onClick={onCopy} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full px-3 py-1.5">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
