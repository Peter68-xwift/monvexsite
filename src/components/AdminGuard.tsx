import { useEffect, type ReactNode } from "react";
import { useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useMe } from "@/hooks/useMe";
import { Loader2, LayoutDashboard, Users, Wallet, Package, Settings, CreditCard, LogOut, Gift, Newspaper, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/payments", label: "Withdrawals", icon: CreditCard },
  { to: "/admin/deposits", label: "Deposits", icon: Banknote },
  { to: "/admin/wallet", label: "Wallet", icon: Wallet },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/gift-codes", label: "Gift Codes", icon: Gift },
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data, isLoading } = useMe();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = data?.roles?.includes("admin");

  useEffect(() => {
    if (isLoading) return;
    if (!data?.profile) navigate({ to: "/auth", replace: true });
    else if (!isAdmin) navigate({ to: "/", replace: true });
  }, [isLoading, data, isAdmin, navigate]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-900 border-r border-slate-800 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Monvex</p>
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-emerald-600/20 text-emerald-300" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800">
            <LayoutDashboard className="h-4 w-4" /> Back to app
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-900/20"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
                  active ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"
                }`}>
                <it.icon className="h-3.5 w-3.5" /> {it.label}
              </Link>
            );
          })}
        </div>
        <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-white"}`}>{value}</p>
    </div>
  );
}