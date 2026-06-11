import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any;
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const stk = payload?.Body?.stkCallback;
        if (!stk?.CheckoutRequestID) {
          // Always 200 to Safaricom so they don't retry on malformed
          return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const { data: tx } = await supabaseAdmin
          .from("transactions")
          .select("id, user_id, amount, status")
          .eq("checkout_request_id", stk.CheckoutRequestID)
          .maybeSingle();

        if (!tx || tx.status !== "pending") {
          return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
        }

        if (stk.ResultCode === 0) {
          // Success — extract receipt and credit balance
          const items: Array<{ Name: string; Value: any }> =
            stk?.CallbackMetadata?.Item ?? [];
          const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
          const amount = Number(
            items.find((i) => i.Name === "Amount")?.Value ?? tx.amount,
          );

          await supabaseAdmin
            .from("transactions")
            .update({
              status: "success",
              mpesa_receipt: receipt ?? null,
              reference: receipt ?? null,
              meta: stk,
            })
            .eq("id", tx.id);

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("balance, referred_by")
            .eq("id", tx.user_id)
            .maybeSingle();

          if (profile) {
            await supabaseAdmin
              .from("profiles")
              .update({ balance: Number(profile.balance) + amount })
              .eq("id", tx.user_id);
            // 10% referral rebate to the user's upline (if any)
            const referrerId = (profile as any).referred_by as string | null;
            if (referrerId) {
              const rebate = Math.round(amount * 0.10 * 100) / 100;
              const { data: r } = await supabaseAdmin
                .from("profiles").select("balance").eq("id", referrerId).maybeSingle();
              if (r) {
                await supabaseAdmin.from("profiles")
                  .update({ balance: Number(r.balance) + rebate }).eq("id", referrerId);
                await supabaseAdmin.from("transactions").insert({
                  user_id: referrerId, type: "rebate", amount: rebate,
                  status: "success", description: "Rebate from downline deposit",
                });
              }
            }
          }
        } else {
          await supabaseAdmin
            .from("transactions")
            .update({
              status: "failed",
              description: stk.ResultDesc ?? "STK Push failed",
              meta: stk,
            })
            .eq("id", tx.id);
        }

        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});