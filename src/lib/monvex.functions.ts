import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---- Profile / wallet ----
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return { profile, roles: (roles ?? []).map((r) => r.role) };
  });

// ---- Packages catalog & user packages ----
export const listCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("packages_catalog")
      .select("*")
      .order("sort_order", { ascending: true });
    return { catalog: data ?? [] };
  });

export const listMyPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_packages")
      .select("*, packages_catalog(name, daily_income, deposit)")
      .eq("user_id", context.userId)
      .order("started_at", { ascending: false });
    return { packages: data ?? [] };
  });

export const purchasePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(1).max(8) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: plan, error: pe } = await supabase
      .from("packages_catalog").select("*").eq("code", data.code).maybeSingle();
    if (pe || !plan) throw new Error("Plan not found");
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Profile missing");
    if (Number(profile.balance) < Number(plan.deposit)) throw new Error("Insufficient balance — please deposit first");

    const expires = new Date(Date.now() + plan.duration_days * 86400_000).toISOString();
    const { error: ipe } = await supabase.from("user_packages").insert({
      user_id: userId, package_code: plan.code, expires_at: expires,
    });
    if (ipe) throw ipe;
    const { error: be } = await supabase.from("profiles")
      .update({ balance: Number(profile.balance) - Number(plan.deposit) }).eq("id", userId);
    if (be) throw be;
    await supabase.from("transactions").insert({
      user_id: userId, type: "deposit", amount: -Number(plan.deposit),
      status: "success", description: `Purchased ${plan.name}`, reference: plan.code,
    });
    return { ok: true };
  });

// ---- Transactions / records ----
export const listMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ type: z.enum(["deposit","withdrawal","rebate","gift"]).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("transactions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100);
    if (data.type) q = q.eq("type", data.type);
    const { data: rows } = await q;
    return { rows: rows ?? [] };
  });

// ---- Deposit (simulated STK) ----
export const createDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    mpesa_number: z.string().min(9).max(15),
    amount: z.number().min(10).max(150000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stkPush, normalizeMsisdn } = await import("./mpesa.server");

    const phone = normalizeMsisdn(data.mpesa_number);
    if (!/^254(7|1)\d{8}$/.test(phone)) throw new Error("Invalid Safaricom number");

    // Build callback URL from the inbound request origin
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const host = getRequestHeader("x-forwarded-host") || getRequestHeader("host");
    const proto = getRequestHeader("x-forwarded-proto") || "https";
    const callbackUrl =
      process.env.MPESA_CALLBACK_URL || `${proto}://${host}/api/public/mpesa/callback`;

    const stk = await stkPush({
      phone,
      amount: data.amount,
      accountReference: "MONVEX",
      description: "Deposit",
      callbackUrl,
    });

    const { error: txe } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: data.amount,
      status: "pending",
      mpesa_number: phone,
      description: "M-Pesa STK Push",
      checkout_request_id: stk.CheckoutRequestID,
      merchant_request_id: stk.MerchantRequestID,
    });
    if (txe) throw txe;

    return {
      ok: true,
      checkout_request_id: stk.CheckoutRequestID,
      message: stk.CustomerMessage,
    };
  });

// ---- Withdrawal ----
export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    mpesa_number: z.string().min(9).max(15),
    amount: z.number().min(100).max(1000000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Profile missing");
    if (Number(profile.balance) < data.amount) throw new Error("Insufficient balance");
    // Reserve funds and create pending withdrawal (admin to approve)
    const { error: txe } = await supabase.from("transactions").insert({
      user_id: userId, type: "withdrawal", amount: data.amount, status: "pending",
      mpesa_number: data.mpesa_number, description: "M-Pesa withdrawal request",
    });
    if (txe) throw txe;
    const { error: be } = await supabase.from("profiles").update({ balance: Number(profile.balance) - data.amount }).eq("id", userId);
    if (be) throw be;
    return { ok: true, balance: Number(profile.balance) - data.amount };
  });

// ---- Team ----
export const getTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: members } = await supabase
      .from("profiles")
      .select("id, phone, full_name, created_at, balance")
      .eq("referred_by", userId);
    const memberIds = (members ?? []).map((m) => m.id);
    let activeIds = new Set<string>();
    let memberPackages: Record<string, string> = {};
    let recharge = 0, withdrawal = 0;
    if (memberIds.length) {
      const { data: pkgs } = await supabase
        .from("user_packages")
        .select("user_id, package_code, status")
        .in("user_id", memberIds);
      (pkgs ?? []).forEach((p) => {
        if (p.status === "active") {
          activeIds.add(p.user_id);
          memberPackages[p.user_id] = p.package_code;
        }
      });
      const { data: txs } = await supabase
        .from("transactions")
        .select("type, amount, status")
        .in("user_id", memberIds)
        .eq("status", "success");
      (txs ?? []).forEach((t) => {
        if (t.type === "deposit" && Number(t.amount) > 0) recharge += Number(t.amount);
        if (t.type === "withdrawal") withdrawal += Number(t.amount);
      });
    }
    const enriched = (members ?? []).map((m) => ({
      ...m,
      package_code: memberPackages[m.id] ?? null,
      active: activeIds.has(m.id),
    }));
    return {
      members: enriched,
      stats: {
        total: enriched.length,
        active: activeIds.size,
        inactive: enriched.length - activeIds.size,
        recharge,
        withdrawal,
        active_packages: Object.keys(memberPackages).length,
      },
    };
  });

// ---- Account security ----
export const updateLoginPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ new_password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.auth.updateUser({ password: data.new_password });
    if (error) throw error;
    return { ok: true };
  });

export const setFundPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ fund_password: z.string().min(4).max(12).regex(/^\d+$/) }).parse(d))
  .handler(async ({ data, context }) => {
    // simple obfuscation; for stronger hashing wire bcrypt via edge fn
    const { createHash } = await import("crypto");
    const hash = createHash("sha256").update(`monvex:${context.userId}:${data.fund_password}`).digest("hex");
    const { error } = await context.supabase.from("profiles").update({ fund_password_hash: hash }).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw error;
    return { ok: true };
  });