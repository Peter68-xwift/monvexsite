import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Wallet, HandCoins, Gem, Vault, Gift, Users, Megaphone, Info, Zap, Power, TrendingUp, ArrowUpRight, MessageCircle, Send } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSettings } from "@/lib/monvex.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monvex — Member Dashboard" },
      { name: "description", content: "Monvex member dashboard." },
    ],
  }),
  component: Index,
});

const tiles = [
  { label: "Deposit", Icon: Wallet, tint: "from-emerald-400/20 to-emerald-500/5", iconColor: "text-emerald-600", to: "/deposit" as const },
  { label: "Withdraw", Icon: HandCoins, tint: "from-rose-400/20 to-rose-500/5", iconColor: "text-rose-600", to: "/withdraw" as const },
  { label: "Levels", Icon: Gem, tint: "from-violet-400/20 to-violet-500/5", iconColor: "text-violet-600", to: "/packages" as const },
  { label: "Wealth", Icon: Vault, tint: "from-amber-400/20 to-amber-500/5", iconColor: "text-amber-600", to: "/wealth" as const },
  { label: "Gift Code", Icon: Gift, tint: "from-pink-400/20 to-pink-500/5", iconColor: "text-pink-600", to: "/gift" as const },
  { label: "My Team", Icon: Users, tint: "from-sky-400/20 to-sky-500/5", iconColor: "text-sky-600", to: "/team" as const },
  { label: "News", Icon: Megaphone, tint: "from-indigo-400/20 to-indigo-500/5", iconColor: "text-indigo-600", to: "/news" as const },
  { label: "Benefits", Icon: Info, tint: "from-teal-400/20 to-teal-500/5", iconColor: "text-teal-600", to: "/company" as const },
  { label: "Promo", Icon: Zap, tint: "from-orange-400/30 to-orange-500/10", iconColor: "text-orange-600", to: "/tasks" as const },
];

function Index() {
  const { data } = useMe();
  const navigate = useNavigate();
  const settingsFn = useServerFn(getPublicSettings);
  const { data: settingsData } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });
  const whatsapp = (settingsData?.settings as any)?.whatsapp_url || "";
  const telegram = (settingsData?.settings as any)?.telegram_url || "";
  const profile = data?.profile;
  const fullName = profile?.full_name || profile?.phone || "Member";
  const initials = fullName.slice(0, 2).toUpperCase();
  const balance = Number(profile?.balance ?? 0);
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <Shell bg="bg-slate-50">
      {/* Header */}
      <div className="relative px-5 pt-10 pb-32 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#2456a6] to-[#3b82f6]" />
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center text-lg font-bold">{initials}</div>
            <div>
              <p className="text-xs text-white/60">Welcome back</p>
              <p className="text-base font-semibold">Hi, {fullName.split(" ")[0]} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="Join WhatsApp"
                className="h-10 w-10 rounded-xl bg-emerald-500/30 ring-1 ring-emerald-300/30 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            {telegram && (
              <a href={telegram} target="_blank" rel="noreferrer" aria-label="Join Telegram"
                className="h-10 w-10 rounded-xl bg-sky-500/30 ring-1 ring-sky-300/30 flex items-center justify-center">
                <Send className="h-4 w-4" />
              </a>
            )}
            <button onClick={signOut} aria-label="Sign out" className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 flex items-center justify-center">
              <Power className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Balance card */}
        <div className="relative mt-8 rounded-3xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-white/70">Current Balance</p>
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.4%
            </span>
          </div>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">
            KES {Math.floor(balance).toLocaleString()}<span className="text-lg font-medium text-white/70">.{(balance % 1).toFixed(2).slice(2)}</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/deposit" className="rounded-xl bg-white text-[#1e3a8a] font-semibold text-sm py-2.5 flex items-center justify-center gap-1.5 shadow-lg">
              <Wallet className="h-4 w-4" /> Deposit
            </Link>
            <Link to="/withdraw" className="rounded-xl bg-white/15 ring-1 ring-white/25 text-white font-semibold text-sm py-2.5 flex items-center justify-center gap-1.5">
              <HandCoins className="h-4 w-4" /> Withdraw
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-20 grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900 mt-1">KES {balance.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-medium">
            <ArrowUpRight className="h-3 w-3" /> +5.2%
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-4 shadow-sm text-white">
          <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">Level Status</p>
          <p className="text-xl font-bold mt-1">Level 3</p>
          <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full w-3/5 bg-gradient-to-r from-amber-400 to-orange-400" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 mt-7 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
        <button className="text-xs font-medium text-slate-500">See all</button>
      </div>
      <div className="px-4 mt-3 grid grid-cols-3 gap-3">
        {tiles.map(({ label, Icon, tint, iconColor, to }) => {
          const inner = (
            <>
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <p className="text-[11px] font-semibold text-slate-700">{label}</p>
            </>
          );
          const cls = "group bg-white rounded-2xl p-3 flex flex-col items-center gap-2 ring-1 ring-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all";
          return to ? (
            <Link key={label} to={to} className={cls}>{inner}</Link>
          ) : (
            <button key={label} className={cls}>{inner}</button>
          );
        })}
      </div>

      {/* Community channels */}
      {(whatsapp || telegram) && (
        <div className="mx-4 mt-6 grid grid-cols-2 gap-3">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-lg flex items-center gap-3">
              <MessageCircle className="h-7 w-7" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">Join us on</p>
                <p className="text-base font-bold">WhatsApp</p>
              </div>
            </a>
          )}
          {telegram && (
            <a href={telegram} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white shadow-lg flex items-center gap-3">
              <Send className="h-7 w-7" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">Join us on</p>
                <p className="text-base font-bold">Telegram</p>
              </div>
            </a>
          )}
        </div>
      )}
    </Shell>
  );
}
