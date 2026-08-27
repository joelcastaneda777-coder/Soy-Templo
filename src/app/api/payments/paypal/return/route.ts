import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { capturePayPalOrder } from "@/lib/payments/paypal-provider";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("token");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? url.origin).replace(/\/$/, "");
  if (!orderId) return NextResponse.redirect(`${siteUrl}/donar?error=paypal`);

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: tx } = await admin
    .from("payment_transactions")
    .select("id, status, donation_id")
    .eq("reference_id", orderId)
    .maybeSingle();

  if (!tx) return NextResponse.redirect(`${siteUrl}/donar?error=transaction`);
  if (tx.status === "completed") {
    return NextResponse.redirect(`${siteUrl}/donar/gracias?ref=${encodeURIComponent(orderId)}`);
  }

  try {
    const event = await capturePayPalOrder(orderId);
    if (event.donationId && event.donationId !== tx.donation_id) {
      throw new Error("La orden no corresponde a la donación registrada");
    }

    await admin.from("payment_transactions").update({
      status: event.status,
      provider_capture_id: event.providerCaptureId ?? null,
      gross_amount_cents: event.grossAmountCents ?? null,
      fee_amount_cents: event.feeAmountCents ?? null,
      net_amount_cents: event.netAmountCents ?? null,
      settled_at: event.settledAt ?? new Date().toISOString(),
      raw_payload: event.rawPayload,
    }).eq("id", tx.id);

    await admin.from("audit_logs").insert({
      action: `payment.${event.status}`,
      entity: "payment_transactions",
      entity_id: tx.id,
    });

    if (event.status !== "completed") return NextResponse.redirect(`${siteUrl}/donar?error=capture`);
    return NextResponse.redirect(`${siteUrl}/donar/gracias?ref=${encodeURIComponent(orderId)}`);
  } catch (error) {
    await admin.from("payment_transactions").update({
      status: "failed",
      error_message: error instanceof Error ? error.message.slice(0, 500) : "PayPal capture failed",
    }).eq("id", tx.id);
    return NextResponse.redirect(`${siteUrl}/donar?error=capture`);
  }
}
