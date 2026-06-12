import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Users, Link2, UserCheck, UserX, ArrowDownToLine, ArrowUpFromLine, Layers } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTeam } from "@/lib/monvex.functions";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team — Monvex" }, { name: "description", content: "Affiliate team on Monvex." }] }),
  component: Team,
});

function Team() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const teamFn = useServerFn(getTeam);
  const { data: team } = useQuery({ queryKey: ["team"], queryFn: () => teamFn() });
  const code = me?.profile?.referral_code ?? "";
  const userCode = (me?.profile as any)?.user_code ?? "";
  const link = typeof window !== "undefined" ? `${window.location.origin}/auth?ref=${code}` : `/auth?ref=${code}`;
  const [copied, setCopied] = useState(false);
  const s = team?.stats;

  const stats = [
    { label: "Total Subordinates", value: String(s?.total ?? 0), Icon: Users, tint: "bg-black", iconColor: "text-[#f5c518]" },
    { label: "Active Subordinates", value: String(s?.active ?? 0), Icon: UserCheck, tint: "bg-emerald-500", iconColor: "text-white" },
    { label: "Inactive Subordinates", value: String(s?.inactive ?? 0), Icon: UserX, tint: "bg-rose-500", iconColor: "text-white" },
    { label: "Team Recharge", value: `KSH ${(s?.recharge ?? 0).toLocaleString()}`, Icon: ArrowDownToLine, tint: "bg-blue-600", iconColor: "text-white" },
    { label: "Team Withdrawal", value: `KSH ${(s?.withdrawal ?? 0).toLocaleString()}`, Icon: ArrowUpFromLine, tint: "bg-orange-500", iconColor: "text-white" },
    { label: "Active Packages", value: String(s?.active_packages ?? 0), Icon: Layers, tint: "bg-violet-600", iconColor: "text-white" },
  ];
  const members = team?.members ?? [];

  return (
    <Shell>
      <div className="px-4 pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs tracking-widest text-black/60">NETWORK</p>
            <h1 className="text-3xl font-extrabold">Affiliate Team</h1>
            {userCode && <p className="text-xs mt-1 text-black/50">Member ID: <span className="font-bold text-black">#{userCode}</span></p>}
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="bg-black text-white px-5 py-2 rounded-full font-semibold text-sm">Logout</button>
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ label, value, Icon, tint, iconColor }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-md">
              <div className={`h-9 w-9 rounded-xl ${tint} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{label}</p>
              <p className="text-xl font-extrabold mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-white rounded-3xl p-5 shadow-md">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#f5c518]" />
            <p className="font-bold tracking-widest text-sm">YOUR UNIQUE INVITE LINK</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this link with your subordinates. They register through it and you earn <span className="font-bold text-black">10%</span> when they buy a package + <span className="font-bold text-black">3%</span> of their daily task income.</p>
          <div className="mt-3 flex gap-2">
            <input value={link} readOnly className="flex-1 bg-[#f5f5f7] rounded-full px-4 py-3 text-sm text-muted-foreground" />
            <button
              onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="bg-black text-white px-6 py-3 rounded-full font-semibold"
            >{copied ? "Copied" : "Copy"}</button>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join me on Monvex — register here: ${link}`)}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-emerald-500 text-white rounded-full py-2 font-bold">Share WhatsApp</a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join me on Monvex")}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-sky-500 text-white rounded-full py-2 font-bold">Share Telegram</a>
          </div>
        </div>

        {/* Subordinates table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-extrabold tracking-widest">SUBORDINATES</p>
            <span className="bg-white rounded-full px-4 py-1 text-xs font-bold">{members.length} USERS</span>
          </div>
          <div className="bg-white rounded-3xl shadow-md overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-black text-white text-[10px] uppercase tracking-wider font-bold">
              <div>Phone</div>
              <div>Package</div>
              <div className="text-center">Status</div>
              <div className="text-right">Joined</div>
            </div>
            {members.length === 0 ? (
              <div className="py-10 text-center text-sm tracking-widest font-semibold text-muted-foreground">NO SUBORDINATES YET</div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-xs border-t border-black/5">
                  <div className="font-semibold truncate">{m.phone}</div>
                  <div>{m.package_code ?? "—"}</div>
                  <div className="text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{m.active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="text-right text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Level breakdown */}
        {[
          { label: "DIRECT - LEVEL 1", commission: "12%" },
          { label: "SECONDARY - LEVEL 2", commission: "3%" },
          { label: "TERTIARY - LEVEL 3", commission: "1%" },
        ].map((t) => (
          <div key={t.label} className="mt-4 bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
            <div>
              <p className="font-extrabold tracking-widest text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-1">Commission {t.commission}</p>
            </div>
            <span className="bg-[#f5c518] rounded-full px-4 py-1 text-xs font-bold">0 USERS</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}