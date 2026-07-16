import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("balance,referral_code")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: txs } = await supabase
      .from("wallet_transactions")
      .select("id,amount,type,reason,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return {
      balance: Number(wallet?.balance ?? 0),
      referralCode: wallet?.referral_code ?? "",
      transactions: txs ?? [],
    };
  });