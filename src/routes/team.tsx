import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Users, Link2, UserCheck, UserX, ArrowDownToLine, ArrowUpFromLine, Layers } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team — Monvex" }, { name: "description", content: "Affiliate team on Monvex." }] }),
  component: Team,
});

function Team() {
  const link = "https://monvex-tech.site/register.php";
  const [copied, setCopied] = useState(false);

  const stats = [
    { label: "Total Subordinates", value: "0", Icon: Users, tint: "bg-black", iconColor: "text-[#f5c518]" },
    { label: "Active Subordinates", value: "0", Icon: UserCheck, tint: "bg-emerald-500", iconColor: "text-white" },
    { label: "Inactive Subordinates", value: "0", Icon: UserX, tint: "bg-rose-500", iconColor: "text-white" },
    { label: "Team Recharge", value: "KSH 0", Icon: ArrowDownToLine, tint: "bg-blue-600", iconColor: "text-white" },
    { label: "Team Withdrawal", value: "KSH 0", Icon: ArrowUpFromLine, tint: "bg-orange-500", iconColor: "text-white" },
    { label: "Active Packages", value: "0", Icon: Layers, tint: "bg-violet-600", iconColor: "text-white" },
  ];

  return (
    <Shell>
      <div className="px-4 pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs tracking-widest text-black/60">NETWORK</p>
            <h1 className="text-3xl font-extrabold">Affiliate Team</h1>
          </div>
          <button className="bg-black text-white px-5 py-2 rounded-full font-semibold text-sm">Logout</button>
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
            <p className="font-bold tracking-widest text-sm">REFERRAL LINK</p>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={link} readOnly className="flex-1 bg-[#f5f5f7] rounded-full px-4 py-3 text-sm text-muted-foreground" />
            <button
              onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="bg-black text-white px-6 py-3 rounded-full font-semibold"
            >{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>

        {/* Subordinates table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <p className="font-extrabold tracking-widest">SUBORDINATES</p>
            <span className="bg-white rounded-full px-4 py-1 text-xs font-bold">0 USERS</span>
          </div>
          <div className="bg-white rounded-3xl shadow-md overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-black text-white text-[10px] uppercase tracking-wider font-bold">
              <div>Phone</div>
              <div>Package</div>
              <div className="text-center">Status</div>
              <div className="text-right">Joined</div>
            </div>
            <div className="py-10 text-center text-sm tracking-widest font-semibold text-muted-foreground">
              NO SUBORDINATES YET
            </div>
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