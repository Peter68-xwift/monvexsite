import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function Shell({ children, bg = "bg-[#f5c518]" }: { children: ReactNode; bg?: string }) {
  return (
    <div className="min-h-screen flex justify-center">
      <div className={`w-full max-w-md ${bg} pb-28 relative`}>
        {children}
        <BottomNav />
      </div>
    </div>
  );
}