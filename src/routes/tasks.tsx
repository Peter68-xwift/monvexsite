import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { Zap, Lock } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Monvex" }, { name: "description", content: "Daily revenue tasks on Monvex." }] }),
  component: Tasks,
});

const sessions = [
  { level: "LEVEL 3 (EXPIRED)", amount: 200 },
  { level: "LEVEL 1 (EXPIRED)", amount: 80 },
];

function Tasks() {
  return (
    <Shell>
      <div className="px-4 pt-6">
        <div className="bg-[#fff8dc] rounded-3xl p-4 flex items-center gap-4 shadow-md">
          <div className="h-14 w-14 rounded-full bg-[#f5c518] flex items-center justify-center">
            <Zap className="h-7 w-7 text-black" />
          </div>
          <div>
            <p className="text-xs tracking-widest text-muted-foreground">CURRENT SESSION</p>
            <p className="text-xl font-bold">Daily Revenue Portal</p>
          </div>
        </div>
        <div className="mt-8 space-y-6">
          {sessions.map((s) => (
            <div key={s.level} className="bg-[#f0d97a]/70 rounded-3xl p-5 shadow-md">
              <div className="flex justify-between items-start">
                <span className="inline-block bg-[#b89d3c]/70 text-[#5a4a14] text-xs font-bold px-4 py-2 rounded-full">{s.level}</span>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-[#7a6420]">{s.amount}<span className="text-xs align-top ml-1">KSH</span></p>
                  <p className="text-xs font-bold tracking-widest text-[#7a6420]">FIXED RETURN</p>
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-[#5a4a14]">Daily Revenue</p>
              <p className="text-xs tracking-widest text-[#7a6420]/70 mt-1">STATUS: ONLINE</p>
              <div className="mt-6 bg-[#e6cc66]/60 rounded-full py-4 flex items-center justify-center gap-2 text-[#7a6420] font-bold tracking-widest text-sm">
                <Lock className="h-4 w-4" /> CYCLE FINISHED
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}