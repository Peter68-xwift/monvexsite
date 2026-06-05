import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Users, Link2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team — Monvex" }, { name: "description", content: "Affiliate team on Monvex." }] }),
  component: Team,
});

function Team() {
  const link = "https://monvex-tech.site/register.php";
  const [copied, setCopied] = useState(false);
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
        <div className="mt-5 bg-[#fff8dc] rounded-3xl p-5 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground">TOTAL MEMBERS</p>
            <p className="text-3xl font-extrabold">0</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center">
            <Users className="h-6 w-6 text-[#f5c518]" />
          </div>
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
        {[
          { label: "DIRECT - LEVEL 1" },
          { label: "SECONDARY - LEVEL 2" },
          { label: "TERTIARY - LEVEL 3" },
        ].map((t) => (
          <div key={t.label} className="mt-6">
            <div className="flex justify-between items-center">
              <p className="font-extrabold tracking-widest">{t.label}</p>
              <span className="bg-white rounded-full px-4 py-1 text-xs font-bold">0 USERS</span>
            </div>
            <div className="mt-3 bg-[#f0d97a]/70 rounded-full py-6 text-center text-sm tracking-widest font-semibold text-[#7a6420]">
              NO TEAM MEMBERS YET
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}