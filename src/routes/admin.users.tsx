import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListUsers, adminToggleUserWithdrawal } from "@/lib/admin.functions";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const [search, setSearch] = useState("");
  const fn = useServerFn(adminListUsers);
  const toggle = useServerFn(adminToggleUserWithdrawal);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fn({ data: { search: search || undefined } }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-slate-900 ring-1 ring-slate-800 px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone or name…"
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-xs uppercase text-slate-400 bg-slate-900/80">
              <tr>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Joined</th>
                <th className="text-left p-3">Package</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-right p-3">Subs (A/I)</th>
                <th className="text-right p-3">Deposits</th>
                <th className="text-right p-3">Withdrawals</th>
                <th className="text-right p-3">W/D</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-800">
                  <td className="p-3 font-mono">{u.phone}</td>
                  <td className="p-3">{u.full_name || "—"}</td>
                  <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{u.package_code || <span className="text-slate-500">None</span>}</td>
                  <td className="p-3 text-right">KES {Number(u.balance).toLocaleString()}</td>
                  <td className="p-3 text-right">{u.subordinates_active}/{u.subordinates_inactive}</td>
                  <td className="p-3 text-right text-emerald-400">KES {Number(u.total_deposits).toLocaleString()}</td>
                  <td className="p-3 text-right text-amber-400">KES {Number(u.total_withdrawals).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={async () => {
                        await toggle({ data: { user_id: u.id, enabled: !u.withdrawal_enabled } });
                        qc.invalidateQueries({ queryKey: ["admin-users"] });
                      }}
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                        u.withdrawal_enabled ? "bg-emerald-600/20 text-emerald-300" : "bg-rose-600/20 text-rose-300"
                      }`}>
                      {u.withdrawal_enabled ? "ON" : "OFF"}
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.users.length && (
                <tr><td colSpan={9} className="p-10 text-center text-slate-500">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}