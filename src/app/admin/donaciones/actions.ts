"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin/donaciones");
  const { data: isAdmin } = await supabase.rpc("has_role", { check_role: "admin" });
  if (!isAdmin) redirect("/admin?error=admin_required");
  return { supabase, user };
}

export async function createSettlement(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const ids = [...new Set(formData.getAll("transactionIds").filter((v): v is string => typeof v === "string" && v.length > 0))];
  if (!ids.length) redirect("/admin/donaciones?error=select_transactions");

  const { data: transactions, error: txError } = await supabase
    .from("payment_transactions")
    .select("id, gross_amount_cents, fee_amount_cents, net_amount_cents")
    .in("id", ids)
    .eq("status", "completed")
    .is("settlement_id", null);
  if (txError || !transactions || transactions.length !== ids.length) redirect("/admin/donaciones?error=invalid_transactions");

  const gross = transactions.reduce((sum, tx) => sum + (tx.gross_amount_cents ?? 0), 0);
  const fee = transactions.reduce((sum, tx) => sum + (tx.fee_amount_cents ?? 0), 0);
  const net = transactions.reduce((sum, tx) => sum + (tx.net_amount_cents ?? Math.max(0, (tx.gross_amount_cents ?? 0) - (tx.fee_amount_cents ?? 0))), 0);
  if (gross <= 0 || net < 0) redirect("/admin/donaciones?error=missing_amounts");

  const providerReference = String(formData.get("providerReference") ?? "").trim().slice(0, 160) || null;
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 1000) || null;

  const { data: settlement, error: settlementError } = await supabase
    .from("donation_settlements")
    .insert({
      provider: "paypal",
      destination_label: "BAC institucional",
      currency: "USD",
      provider_reference: providerReference,
      gross_amount_cents: gross,
      fee_amount_cents: fee,
      net_amount_cents: net,
      status: "pending",
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (settlementError || !settlement) redirect("/admin/donaciones?error=create_settlement");

  const { error: assignError } = await supabase
    .from("payment_transactions")
    .update({ settlement_id: settlement.id })
    .in("id", ids)
    .is("settlement_id", null);
  if (assignError) {
    await supabase.from("donation_settlements").delete().eq("id", settlement.id);
    redirect("/admin/donaciones?error=assign_settlement");
  }

  revalidatePath("/admin/donaciones");
  redirect("/admin/donaciones?created=1");
}

export async function completeSettlement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("settlementId") ?? "");
  if (!id) redirect("/admin/donaciones?error=settlement_required");
  await supabase
    .from("donation_settlements")
    .update({ status: "completed", deposited_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  revalidatePath("/admin/donaciones");
  redirect("/admin/donaciones?deposited=1");
}

export async function cancelSettlement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("settlementId") ?? "");
  if (!id) redirect("/admin/donaciones?error=settlement_required");
  await supabase.from("payment_transactions").update({ settlement_id: null }).eq("settlement_id", id);
  await supabase.from("donation_settlements").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  revalidatePath("/admin/donaciones");
  redirect("/admin/donaciones?cancelled=1");
}
