"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { sleep } from "@/lib/utils";

const donationSchema = z.object({
  amountCents: z.coerce.number().int().min(100, "El monto mínimo es $1.00").max(5_000_000),
  categoryId: z.string().uuid("Selecciona un destino"),
  isAnonymous: z.boolean(),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
});

export type DonationFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createDonation(_prev: DonationFormState, formData: FormData): Promise<DonationFormState> {
  const parsed = donationSchema.safeParse({
    amountCents: formData.get("amountCents"),
    categoryId: formData.get("categoryId"),
    isAnonymous: formData.get("isAnonymous") === "on",
    donorName: formData.get("donorName") ?? undefined,
    donorEmail: formData.get("donorEmail") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const provider = getPaymentProvider();
  if (!provider.configured) {
    return { error: "Las donaciones por PayPal todavía no están activadas. La cuenta institucional está pendiente de configuración." };
  }

  const input = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: category } = await supabase
    .from("donation_categories")
    .select("slug")
    .eq("id", input.categoryId)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) return { error: "El destino de la donación ya no está disponible." };

  const donationId = crypto.randomUUID();
  const { error: donationError } = await supabase.from("donations").insert({
    id: donationId,
    user_id: user?.id ?? null,
    category_id: input.categoryId,
    amount_cents: input.amountCents,
    currency: "USD",
    is_anonymous: input.isAnonymous,
    donor_name: input.isAnonymous ? null : input.donorName || null,
    donor_email: input.isAnonymous ? null : input.donorEmail || null,
  });
  if (donationError) return { error: "No pudimos registrar la donación. Intenta de nuevo." };

  const checkout = await provider.createCheckout({
    donationId,
    amountCents: input.amountCents,
    currency: "USD",
    categorySlug: category.slug,
    donorEmail: input.donorEmail || undefined,
  });

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!checkout.ok) {
    await admin.from("donations").delete().eq("id", donationId);
    return { error: checkout.error };
  }

  const { error: transactionError } = await admin.from("payment_transactions").insert({
    donation_id: donationId,
    provider: provider.name,
    reference_id: checkout.referenceId,
    status: "pending",
  });
  if (transactionError) {
    await admin.from("donations").delete().eq("id", donationId);
    return { error: "El pago fue preparado, pero no pudimos registrarlo. Intenta nuevamente." };
  }

  await sleep(400); // pequeño respiro para que se sienta como una confirmación real
  redirect(checkout.redirectUrl);
}
