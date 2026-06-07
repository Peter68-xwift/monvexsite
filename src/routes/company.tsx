import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { ArrowLeft, Building2, Target, Globe, Sparkles } from "lucide-react";

export const Route = createFileRoute("/company")({
  head: () => ({ meta: [{ title: "Company Information — Monvex" }] }),
  component: Company,
});

function Company() {
  return (
    <Shell>
      <div className="px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/profile" className="rounded-full bg-white p-2 shadow"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-extrabold">Company Information</h1>
        </div>

        <div className="bg-gradient-to-br from-[#2563eb] to-[#7c3aed] rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-2xl p-3"><Building2 className="h-7 w-7" /></div>
            <div>
              <p className="text-xs tracking-widest opacity-80">REGISTERED COMPANY</p>
              <h2 className="text-2xl font-extrabold">Monvex Holdings Ltd.</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed opacity-95">
            Monvex is a global digital earnings platform that empowers users to grow their income
            through investment packages, daily tasks, referral rewards, and CDK gift redemptions.
            Founded in 2021, Monvex partners with verified merchants and brands to deliver secure,
            transparent and profitable earning opportunities to members across Africa and beyond.
          </p>
        </div>

        <div className="mt-5 bg-white rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex gap-3">
            <Target className="h-6 w-6 text-rose-500 shrink-0" />
            <div>
              <p className="font-bold">Our Mission</p>
              <p className="text-sm text-muted-foreground">To make financial growth simple, accessible and rewarding for everyone — turning everyday engagement into real income.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Sparkles className="h-6 w-6 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">Our Vision</p>
              <p className="text-sm text-muted-foreground">To become the most trusted earning ecosystem connecting millions of users with verified digital opportunities.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Globe className="h-6 w-6 text-sky-500 shrink-0" />
            <div>
              <p className="font-bold">Global Reach</p>
              <p className="text-sm text-muted-foreground">Active members in over 30 countries, with localized support and instant M-Pesa payouts in Kenya.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-white rounded-3xl p-5 shadow-md">
          <h3 className="font-extrabold text-lg mb-3">Company Details</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <Row k="Founded" v="2021" />
            <Row k="Headquarters" v="Nairobi, Kenya" />
            <Row k="Registration No." v="PVT-9X8Y7Z" />
            <Row k="Industry" v="Digital Investment & Rewards" />
            <Row k="Support Email" v="support@monvex.app" />
            <Row k="Website" v="www.monvex.app" />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-black/5 pb-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}