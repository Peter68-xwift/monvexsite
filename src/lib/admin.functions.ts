import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ---------- DASHBOARD ----------
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const since = startOfDay.toISOString();

    const [{ data: profiles }, { data: txs }, { data: txsToday }, { data: pkgs }, { data: catalog }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, balance"),
        supabaseAdmin.from("transactions").select("type, amount, status"),
        supabaseAdmin.from("transactions").select("type, amount, status, created_at").gte("created_at", since),
        supabaseAdmin.from("user_packages").select("user_id, package_code, status"),
        supabaseAdmin.from("packages_catalog").select("code, name, deposit"),
      ]);

    const totalMembers = profiles?.length ?? 0;
    const cashBalance = (profiles ?? []).reduce((s, p) => s + Number(p.balance), 0);
    const activeUsers = new Set((pkgs ?? []).filter((p) => p.status === "active").map((p) => p.user_id)).size;

    let moneyInToday = 0, moneyOutToday = 0, profitToday = 0, lossToday = 0, paymentsToday = 0;
    (txsToday ?? []).forEach((t) => {
      const amt = Number(t.amount);
      if (t.status !== "success") return;
      if (t.type === "deposit" && amt > 0) { moneyInToday += amt; paymentsToday++; }
      if (t.type === "withdrawal") { moneyOutToday += amt; lossToday += amt; }
      if (t.type === "rebate" || t.type === "gift") profitToday += amt;
    });

    let totalPurchases = 0;
    (txs ?? []).forEach((t) => {
      if (t.type === "deposit" && Number(t.amount) < 0 && t.status === "success") totalPurchases += Math.abs(Number(t.amount));
    });

    // Per-package purchase totals
    const pkgCounts: Record<string, number> = {};
    (pkgs ?? []).forEach((p) => { pkgCounts[p.package_code] = (pkgCounts[p.package_code] ?? 0) + 1; });
    const packageBreakdown = (catalog ?? []).map((c) => ({
      code: c.code, name: c.name, count: pkgCounts[c.code] ?? 0,
      total: (pkgCounts[c.code] ?? 0) * Number(c.deposit),
    }));

    // System liability = sum of remaining expected payouts from active packages
    const { data: activePkgs } = await supabaseAdmin
      .from("user_packages")
      .select("package_code, total_earned, packages_catalog(total_return)")
      .eq("status", "active");
    let liability = 0;
    (activePkgs ?? []).forEach((p: any) => {
      const ret = Number(p.packages_catalog?.total_return ?? 0);
      liability += Math.max(0, ret - Number(p.total_earned));
    });
    liability += cashBalance;

    return {
      totalMembers, activeUsers, cashBalance, totalPurchases,
      moneyInToday, moneyOutToday, profitToday, lossToday, paymentsToday,
      packageBreakdown, liability,
    };
  });

// ---------- USERS ----------
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ search: z.string().max(60).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select("id, phone, full_name, balance, created_at, withdrawal_enabled, referred_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.search) {
      const s = `%${data.search}%`;
      q = q.or(`phone.ilike.${s},full_name.ilike.${s}`);
    }
    const { data: profiles } = await q;
    const ids = (profiles ?? []).map((p) => p.id);
    if (!ids.length) return { users: [] };

    const [{ data: pkgs }, { data: txs }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("user_packages").select("user_id, package_code, status").in("user_id", ids),
      supabaseAdmin.from("transactions").select("user_id, type, amount, status").in("user_id", ids),
      supabaseAdmin.from("profiles").select("id, referred_by").in("referred_by", ids),
    ]);
    const activePkgMap: Record<string, string> = {};
    (pkgs ?? []).forEach((p) => { if (p.status === "active") activePkgMap[p.user_id] = p.package_code; });

    const depositMap: Record<string, number> = {};
    const withdrawMap: Record<string, number> = {};
    (txs ?? []).forEach((t) => {
      if (t.status !== "success") return;
      if (t.type === "deposit" && Number(t.amount) > 0) depositMap[t.user_id] = (depositMap[t.user_id] ?? 0) + Number(t.amount);
      if (t.type === "withdrawal") withdrawMap[t.user_id] = (withdrawMap[t.user_id] ?? 0) + Number(t.amount);
    });

    const downlineIds: Record<string, string[]> = {};
    (subs ?? []).forEach((s) => {
      if (!s.referred_by) return;
      (downlineIds[s.referred_by] ??= []).push(s.id);
    });
    const activeUserSet = new Set(Object.keys(activePkgMap));

    const users = (profiles ?? []).map((p) => {
      const sub = downlineIds[p.id] ?? [];
      const subActive = sub.filter((id) => activeUserSet.has(id)).length;
      return {
        ...p,
        package_code: activePkgMap[p.id] ?? null,
        subordinates_total: sub.length,
        subordinates_active: subActive,
        subordinates_inactive: sub.length - subActive,
        total_deposits: depositMap[p.id] ?? 0,
        total_withdrawals: withdrawMap[p.id] ?? 0,
      };
    });
    return { users };
  });

// ---------- WITHDRAWAL APPROVALS ----------
export const adminListPendingWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txs } = await supabaseAdmin
      .from("transactions")
      .select("id, user_id, amount, mpesa_number, created_at, status, description")
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const ids = (txs ?? []).map((t) => t.user_id);
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, phone, full_name").in("id", ids)
      : { data: [] as any[] };
    const map: Record<string, any> = {};
    (profiles ?? []).forEach((p) => { map[p.id] = p; });
    return { rows: (txs ?? []).map((t) => ({ ...t, profile: map[t.user_id] ?? null })) };
  });

export const adminDecideWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ tx_id: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tx } = await supabaseAdmin
      .from("transactions").select("*").eq("id", data.tx_id).maybeSingle();
    if (!tx || tx.type !== "withdrawal" || tx.status !== "pending") throw new Error("Invalid transaction");
    if (data.decision === "approve") {
      await supabaseAdmin.from("transactions").update({ status: "success" }).eq("id", tx.id);
    } else {
      // Refund
      const { data: p } = await supabaseAdmin.from("profiles").select("balance").eq("id", tx.user_id).maybeSingle();
      if (p) {
        await supabaseAdmin.from("profiles")
          .update({ balance: Number(p.balance) + Number(tx.amount) })
          .eq("id", tx.user_id);
      }
      await supabaseAdmin.from("transactions")
        .update({ status: "failed", description: "Rejected by admin — refunded" })
        .eq("id", tx.id);
    }
    return { ok: true };
  });

// ---------- WALLET ADJUSTMENT ----------
export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      amount: z.number().refine((n) => n !== 0, "Non-zero"),
      note: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("profiles").select("balance").eq("id", data.user_id).maybeSingle();
    if (!p) throw new Error("User not found");
    const newBal = Number(p.balance) + data.amount;
    if (newBal < 0) throw new Error("Adjustment would leave negative balance");
    await supabaseAdmin.from("profiles").update({ balance: newBal }).eq("id", data.user_id);
    await supabaseAdmin.from("transactions").insert({
      user_id: data.user_id,
      type: data.amount > 0 ? "gift" : "withdrawal",
      amount: Math.abs(data.amount),
      status: "success",
      description: data.note || (data.amount > 0 ? "Admin credit" : "Admin debit"),
    });
    return { ok: true, balance: newBal };
  });

// ---------- PACKAGES ----------
export const adminUpsertPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      code: z.string().min(1).max(8),
      name: z.string().min(1).max(60),
      deposit: z.number().min(1),
      daily_income: z.number().min(0),
      duration_days: z.number().int().min(1).max(3650),
      total_return: z.number().min(0),
      sort_order: z.number().int().min(0).max(999),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("packages_catalog").upsert(data);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeletePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(1).max(8) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("packages_catalog").delete().eq("code", data.code);
    if (error) throw error;
    return { ok: true };
  });

// ---------- SETTINGS ----------
export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("site_settings").select("*").eq("id", 1).maybeSingle();
    return { settings: data };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      withdrawals_enabled: z.boolean().optional(),
      tasks_enabled: z.boolean().optional(),
      registrations_enabled: z.boolean().optional(),
      maintenance_mode: z.boolean().optional(),
      min_deposit: z.number().min(1).max(100000).optional(),
      min_withdrawal: z.number().min(1).max(1000000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

export const adminToggleUserWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles")
      .update({ withdrawal_enabled: data.enabled }).eq("id", data.user_id);
    if (error) throw error;
    return { ok: true };
  });