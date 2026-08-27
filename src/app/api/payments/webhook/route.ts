import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  const body = await request.text();

  let event;
  try {
    event = await getPaymentProvider().parseWebhook(body, request.headers);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  if (!event) return NextResponse.json({ ok: true, ignored: true });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin
    .from("payment_transactions")
    .select("id, status")
    .limit(1);
  if (event.referenceId) query = query.eq("reference_id", event.referenceId);
  else if (event.donationId) query = query.eq("donation_id", event.donationId);
  else return NextResponse.json({ ok: true, ignored: true });

  const { data: rows } = await query;
  const tx = rows?.[0];
  if (!tx) return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  if (tx.status === event.status) return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await admin
    .from("payment_transactions")
    .update({
      status: event.status,
      provider_capture_id: event.providerCaptureId ?? null,
      gross_amount_cents: event.grossAmountCents ?? null,
      fee_amount_cents: event.feeAmountCents ?? null,
      net_amount_cents: event.netAmountCents ?? null,
      settled_at: event.settledAt ?? null,
      raw_payload: event.rawPayload,
    })
    .eq("id", tx.id);

  if (error) return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });

  await admin.from("audit_logs").insert({
    action: `payment.${event.status}`,
    entity: "payment_transactions",
    entity_id: tx.id,
  });

  return NextResponse.json({ ok: true });
}
