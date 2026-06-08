import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AuthGuard } from "./AuthGuard";

export function Shell({ children, bg = "bg-[#f5c518]" }: { children: ReactNode; bg?: string }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex justify-center">
        <div className={`w-full max-w-md ${bg} pb-28 relative`}>
          {children}
          <BottomNav />
        </div>
      </div>
    </AuthGuard>
  );
}