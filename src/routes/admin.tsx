import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Monvex" }] }),
  component: () => (
    <AdminGuard>
      <Outlet />
    </AdminGuard>
  ),
});