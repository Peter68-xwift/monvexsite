import { Link } from "@tanstack/react-router";
import { Home, Rocket, Users, Gem, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/tasks", label: "Tasks", Icon: Rocket },
  { to: "/team", label: "Team", Icon: Users },
  { to: "/packages", label: "Packages", Icon: Gem },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-black/5 flex justify-around py-3 z-50">
      {items.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground data-[status=active]:text-[#f5c518] data-[status=active]:font-semibold"
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}