import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Wallet, HandCoins, Gem, Vault, Gift, Users, Megaphone, Info, Zap, Power } from "lucide-react";

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
  { label: "DEPOSIT", Icon: Wallet },
  { label: "WITHDRAW", Icon: HandCoins },
  { label: "LEVELS", Icon: Gem },
  { label: "WEALTH", Icon: Vault },
  { label: "GIFT CARD", Icon: Gift },
  { label: "MY TEAM", Icon: Users },
  { label: "NEWS", Icon: Megaphone },
  { label: "BENEFITS", Icon: Info },
  { label: "PROMO", Icon: Zap, accent: true },
];

function Index() {
  return (
    <Shell>
      <div className="bg-[#2456a6] rounded-b-[2rem] px-6 pt-8 pb-16 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">J</div>
            <div>
              <p className="text-xl font-bold">Hi, Jn</p>
              <p className="text-xs tracking-widest text-white/70">MEMBER DASHBOARD</p>
            </div>
          </div>
          <button className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Power className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-8">
          <p className="text-xs tracking-widest text-white/70">CURRENT BALANCE</p>
          <p className="text-5xl font-extrabold mt-1">KES 327<span className="text-base align-top">.00</span></p>
        </div>
      </div>
      <div className="px-4 -mt-10 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl py-5 text-center shadow-lg">
          <p className="text-xs tracking-widest text-muted-foreground">TOTAL REVENUE</p>
          <p className="text-2xl font-bold text-[#2456a6] mt-1">KES 327</p>
        </div>
        <div className="bg-white rounded-3xl py-5 text-center shadow-lg">
          <p className="text-xs tracking-widest text-muted-foreground">LEVEL STATUS</p>
          <p className="text-2xl font-bold text-[#2456a6] mt-1">Level 3</p>
        </div>
      </div>
      <div className="px-4 mt-6 grid grid-cols-3 gap-4">
        {tiles.map(({ label, Icon, accent }) => (
          <div key={label} className="bg-white rounded-3xl p-4 flex flex-col items-center gap-2 shadow-md">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${accent ? "bg-[#2456a6]" : "bg-[#eaf0fb]"}`}>
              <Icon className={`h-6 w-6 ${accent ? "text-[#f5c518]" : "text-[#2456a6]"}`} />
            </div>
            <p className="text-xs font-bold tracking-wide">{label}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}
