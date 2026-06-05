import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Monitor, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Monvex" }, { name: "description", content: "Profile and earnings on Monvex." }] }),
  component: Profile,
});

const links = [
  { label: "Company Information", Icon: Monitor, color: "text-[#2456a6]" },
  { label: "Financial Records", Icon: MessageCircle, color: "text-sky-400" },
  { label: "Account Security", Icon: ShieldCheck, color: "text-amber-700" },
  { label: "App Download", Icon: Smartphone, color: "text-rose-400" },
];

function Profile() {
  return (
    <Shell>
      <div className="px-4 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#fff8dc] rounded-3xl p-5 text-center shadow-md">
            <p className="text-xs tracking-widest text-muted-foreground">TODAY'S EARNINGS</p>
            <p className="text-2xl font-extrabold mt-2">0.00 <span className="text-[#f5c518] text-sm">KSH</span></p>
          </div>
          <div className="bg-[#fff8dc] rounded-3xl p-5 text-center shadow-md">
            <p className="text-xs tracking-widest text-muted-foreground">WALLET BALANCE</p>
            <p className="text-2xl font-extrabold mt-2">327.00 <span className="text-[#f5c518] text-sm">KSH</span></p>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold mt-6">Earnings Overview</h2>
        <div className="mt-3 bg-white rounded-3xl p-5 shadow-md grid grid-cols-2 gap-y-5">
          <div><p className="text-xs tracking-widest text-muted-foreground">TOTAL REVENUE</p><p className="font-extrabold text-lg">327.00 KSH</p></div>
          <div><p className="text-xs tracking-widest text-muted-foreground">REFERRAL EARNINGS</p><p className="font-extrabold text-lg">1.00 KSH</p></div>
          <div><p className="text-xs tracking-widest text-muted-foreground">TASK/JOB</p><p className="font-extrabold text-lg">318.00 KSH</p></div>
          <div><p className="text-xs tracking-widest text-muted-foreground">CDK WINS</p><p className="font-extrabold text-lg">0.00 KSH</p></div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button className="bg-[#2563eb] text-white rounded-2xl py-4 font-bold">Recharge</button>
          <button className="bg-[#e85b2a] text-white rounded-2xl py-4 font-bold">Withdraw</button>
          <button className="bg-emerald-500 text-white rounded-2xl py-4 font-bold">Redeem CDK</button>
        </div>
        <div className="mt-6 bg-white rounded-3xl shadow-md divide-y divide-black/5">
          {links.map(({ label, Icon, color }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <Icon className={`h-6 w-6 ${color}`} />
              <p className="font-bold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}