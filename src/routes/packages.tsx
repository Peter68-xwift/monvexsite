import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/packages")({
  head: () => ({ meta: [{ title: "Packages — Monvex" }, { name: "description", content: "Investment plans on Monvex." }] }),
  component: Packages,
});

const plans = [
  { tag: "DELL", level: "Level 1", price: "800", daily: "80", total: "1,280" },
  { tag: "HP", level: "Level 2", price: "1,800", daily: "130", total: "2,600" },
  { tag: "LENOVO", level: "Level 3", price: "3,500", daily: "260", total: "5,200" },
];

function Packages() {
  return (
    <Shell>
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-extrabold">Investment Plans</h1>
        <div className="mt-5 bg-[#fff8dc] rounded-3xl p-6 text-center shadow-md">
          <p className="text-sm tracking-wide text-muted-foreground">AVAILABLE FOR INVESTMENT</p>
          <p className="text-4xl font-extrabold mt-2">300.00 <span className="text-[#f5c518] text-xl">KSH</span></p>
        </div>
        <div className="mt-6 space-y-5">
          {plans.map((p) => (
            <div key={p.tag} className="bg-white rounded-3xl p-5 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full">{p.tag}</span>
                  <p className="text-2xl font-extrabold mt-2">{p.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs tracking-widest text-muted-foreground">LIMIT</p>
                  <p className="text-xl font-bold text-emerald-500">0 / 2</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">PRICE</p>
                  <p className="font-bold">{p.price}</p>
                </div>
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">DAILY</p>
                  <p className="font-bold text-emerald-500">{p.daily}</p>
                </div>
                <div className="bg-[#f6f7fa] rounded-2xl py-3 text-center">
                  <p className="text-xs text-muted-foreground">TOTAL</p>
                  <p className="font-bold text-[#2456a6]">{p.total}</p>
                </div>
              </div>
              <button className="mt-5 w-full bg-[#f5c518] rounded-full py-4 font-extrabold tracking-widest">ACTIVATE NOW</button>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}