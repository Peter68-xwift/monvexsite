import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { loading, signedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !signedIn) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, signedIn, navigate]);

  if (loading || !signedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  return <>{children}</>;
}