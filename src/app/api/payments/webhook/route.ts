import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Webhook de confirmación de pagos.
 * Usa el service role (solo servidor) para actualizar transacciones,
 * verifica la firma del proveedor y previene duplicados: una transacción
 * "completed" nunca se procesa dos veces.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-payment-signature");

  let event;
  try {
    event = await getPaymentProvider().parseWebhook(body, signature);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tx } = await admin
    .from("payment_transactions")
    .select("id, status")
    .eq("reference_id", event.referenceId)
    .maybeSingle();

  if (!tx) return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  if (tx.status === "completed") return NextResponse.json({ ok: true, duplicate: true });

  const { error } = await admin
    .from("payment_transactions")
    .update({ status: event.status, raw_payload: event.rawPayload })
    .eq("id", tx.id);

  if (error) return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });

  await admin.from("audit_logs").insert({
    action: `payment.${event.status}`,
    entity: "payment_transactions",
    entity_id: tx.id,
  });

  return NextResponse.json({ ok: true });
}
