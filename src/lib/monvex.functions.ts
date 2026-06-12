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

// ---- Public site settings (for deposit info, social links, limits) ----
export const getPublicSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("site_settings")
      .select("min_deposit, min_withdrawal, withdrawals_enabled, payment_paybill, payment_account, payment_instructions, whatsapp_url, telegram_url")
      .eq("id", 1)
      .maybeSingle();
    return { settings: data };
  });

// ---- News ----
export const listNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("news_posts" as any)
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50);
    return { posts: (data ?? []) as unknown as Array<{ id: string; title: string; body: string; cover_url: string | null; created_at: string }> };
  });

// ---- Gift code redemption ----
export const redeemGiftCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gc } = await supabaseAdmin
      .from("gift_codes" as any)
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (!gc) throw new Error("Invalid gift code");
    const g = gc as any;
    if (!g.active) throw new Error("This code is no longer active");
    if (g.expires_at && new Date(g.expires_at).getTime() < Date.now()) throw new Error("This code has expired");
    if (g.used_count >= g.max_redemptions) throw new Error("This code has reached its redemption limit");
    const { data: existing } = await supabaseAdmin
      .from("gift_redemptions" as any)
      .select("id")
      .eq("user_id", context.userId)
      .eq("code", code)
      .maybeSingle();
    if (existing) throw new Error("You have already redeemed this code");

    const { error: re } = await supabaseAdmin.from("gift_redemptions" as any).insert({
      user_id: context.userId, code, amount: g.amount,
    });
    if (re) throw re;
    await supabaseAdmin.from("gift_codes" as any).update({ used_count: g.used_count + 1 }).eq("id", g.id);
    const { data: p } = await supabaseAdmin.from("profiles").select("balance").eq("id", context.userId).maybeSingle();
    await supabaseAdmin.from("profiles").update({ balance: Number(p?.balance ?? 0) + Number(g.amount) }).eq("id", context.userId);
    await supabaseAdmin.from("transactions").insert({
      user_id: context.userId, type: "gift", amount: Number(g.amount),
      status: "success", description: `Gift code ${code}`, reference: code,
    });
    return { ok: true, amount: Number(g.amount) };
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
    // Max 2 purchases per package code per user
    const { count: ownedCount } = await supabase
      .from("user_packages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("package_code", plan.code);
    if ((ownedCount ?? 0) >= 2) throw new Error("You have reached the maximum of 2 purchases for this package");
    const { data: profile } = await supabase.from("profiles").select("balance, referred_by").eq("id", userId).maybeSingle();
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
    // 10% referral rebate to upline on package purchase
    if ((profile as any).referred_by) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await creditReferralRebate(supabaseAdmin, (profile as any).referred_by, Number(plan.deposit), `Rebate from ${plan.code} purchase`);
    }
    return { ok: true };
  });

async function creditReferralRebate(supabaseAdmin: any, referrerId: string, baseAmount: number, note: string) {
  const rebate = Math.round(baseAmount * 0.10 * 100) / 100;
  if (rebate <= 0) return;
  const { data: r } = await supabaseAdmin.from("profiles").select("balance").eq("id", referrerId).maybeSingle();
  if (!r) return;
  await supabaseAdmin.from("profiles").update({ balance: Number(r.balance) + rebate }).eq("id", referrerId);
  await supabaseAdmin.from("transactions").insert({
    user_id: referrerId, type: "rebate", amount: rebate, status: "success", description: note,
  });
}

// ---- Daily task claim (one per day, sums active package daily_income) ----
export const claimDailyIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const { data: pkgs } = await supabase
      .from("user_packages")
      .select("id, last_claimed_at, packages_catalog(daily_income)")
      .eq("user_id", userId)
      .eq("status", "active");
    const eligible = (pkgs ?? []).filter((p: any) => p.last_claimed_at !== today);
    if (!eligible.length) {
      if (!pkgs?.length) throw new Error("You need to purchase a package first");
      throw new Error("You have already claimed today. Come back tomorrow.");
    }
    let total = 0;
    for (const p of eligible) {
      total += Number((p as any).packages_catalog?.daily_income ?? 0);
    }
    if (total <= 0) throw new Error("Nothing to claim today");
    const ids = eligible.map((p: any) => p.id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_packages").update({ last_claimed_at: today }).in("id", ids);
    const { data: pr } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).maybeSingle();
    await supabaseAdmin.from("profiles").update({ balance: Number(pr?.balance ?? 0) + total }).eq("id", userId);
    await supabaseAdmin.from("transactions").insert({
      user_id: userId, type: "rebate", amount: total, status: "success", description: "Daily task claim",
    });
    // 3% commission to the upline (referrer) on subordinate's daily claim
    const { data: myProfile } = await supabaseAdmin.from("profiles").select("referred_by").eq("id", userId).maybeSingle();
    if ((myProfile as any)?.referred_by) {
      const commission = Math.round(total * 0.03 * 100) / 100;
      if (commission > 0) {
        const { data: up } = await supabaseAdmin.from("profiles").select("balance").eq("id", (myProfile as any).referred_by).maybeSingle();
        if (up) {
          await supabaseAdmin.from("profiles").update({ balance: Number(up.balance) + commission }).eq("id", (myProfile as any).referred_by);
          await supabaseAdmin.from("transactions").insert({
            user_id: (myProfile as any).referred_by, type: "rebate", amount: commission,
            status: "success", description: "3% subordinate daily task commission",
          });
        }
      }
    }
    return { ok: true, amount: total };
  });

// ---- Manual deposit (user pastes mpesa SMS, admin approves) ----
export const createManualDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    amount: z.number().min(10).max(1000000),
    mpesa_message: z.string().trim().min(10).max(1000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: context.userId,
      type: "deposit",
      amount: data.amount,
      status: "pending",
      method: "manual",
      mpesa_message: data.mpesa_message,
      description: "Manual M-Pesa deposit (awaiting admin approval)",
    } as any);
    if (error) throw error;
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
      method: "stk",
    } as any);
    if (txe) throw txe;

    return {
      ok: true,
      checkout_request_id: stk.CheckoutRequestID,
      message: stk.CustomerMessage,
    };
  });

export const getDepositStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ checkout_request_id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: tx } = await context.supabase
      .from("transactions")
      .select("status, amount, mpesa_receipt, description")
      .eq("checkout_request_id", data.checkout_request_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { tx: tx ?? null };
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
    // Nairobi (UTC+3) business hours: Mon–Fri 09:00–17:00, Sat 09:00–14:00
    const utcMs = Date.now();
    const nboDate = new Date(utcMs + 3 * 3600_000);
    const day = nboDate.getUTCDay(); // 0 Sun .. 6 Sat
    const hour = nboDate.getUTCHours();
    if (day === 0) throw new Error("Withdrawals are processed Mon–Sat only.");
    if (day === 6) {
      if (hour < 9 || hour >= 14) throw new Error("Saturday withdrawals are processed between 9:00 AM and 2:00 PM (EAT).");
    } else {
      if (hour < 9 || hour >= 17) throw new Error("Withdrawals are processed between 9:00 AM and 5:00 PM (EAT).");
    }
    const { data: settings } = await supabase.from("site_settings").select("withdrawals_enabled, min_withdrawal").eq("id", 1).maybeSingle();
    if (settings && settings.withdrawals_enabled === false) throw new Error("Withdrawals are currently suspended");
    if (settings && data.amount < Number(settings.min_withdrawal)) throw new Error(`Minimum withdrawal is KES ${settings.min_withdrawal}`);
    const { data: profile } = await supabase.from("profiles").select("balance, withdrawal_enabled, has_withdrawn").eq("id", userId).maybeSingle();
    if (!profile) throw new Error("Profile missing");
    if ((profile as any).withdrawal_enabled === false) throw new Error("Your withdrawal access is disabled. Contact support.");
    if ((profile as any).has_withdrawn === true) throw new Error("You have already used your one-time withdrawal.");
    if (Number(profile.balance) < data.amount) throw new Error("Insufficient balance");
    const tax = Math.round(data.amount * 0.10 * 100) / 100;
    const net = data.amount - tax;
    // Reserve funds and create pending withdrawal (admin to approve)
    const { error: txe } = await supabase.from("transactions").insert({
      user_id: userId, type: "withdrawal", amount: data.amount, status: "pending",
      mpesa_number: data.mpesa_number,
      description: `M-Pesa withdrawal request — tax KES ${tax.toFixed(2)}, net KES ${net.toFixed(2)}`,
    });
    if (txe) throw txe;
    const { error: be } = await supabase.from("profiles").update({ balance: Number(profile.balance) - data.amount, has_withdrawn: true } as any).eq("id", userId);
    if (be) throw be;
    return { ok: true, balance: Number(profile.balance) - data.amount, tax, net };
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