import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Vault, Sparkles } from "lucide-react";

export const Route = createFileRoute("/wealth")({
  head: () => ({ meta: [{ title: "Wealth — Monvex" }, { name: "description", content: "Wealth — coming soon." }] }),
  component: WealthPage,
});

function WealthPage() {
  return (
    <Shell bg="bg-slate-50">
      <div className="relative px-5 pt-10 pb-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link to="/" className="h-10 w-10 rounded-xl bg-white/15 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs text-white/70">Premium feature</p>
            <h1 className="text-lg font-bold">Wealth Vault</h1>
          </div>
        </div>
      </div>
      <div className="px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-3xl p-8 shadow-xl ring-1 ring-black/5 text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Vault className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Coming Soon</h2>
          <p className="text-sm text-slate-500">
            Our Wealth Vault is under construction. You'll soon be able to grow long-term savings with premium yield products.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Launching soon — stay tuned
          </div>
        </div>
      </div>
    </Shell>
  );
}