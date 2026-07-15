"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";

const donationSchema = z.object({
  amountCents: z.coerce.number().int().min(100, "El monto mínimo es $1.00").max(5_000_000),
  categoryId: z.string().uuid("Selecciona un destino"),
  categorySlug: z.string().min(1),
  isAnonymous: z.coerce.boolean(),
  donorName: z.string().trim().max(120).optional(),
  donorEmail: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
});

export type DonationFormState = { error?: string; fieldErrors?: Record<string, string> };

export async function createDonation(
  _prev: DonationFormState,
  formData: FormData
): Promise<DonationFormState> {
  const parsed = donationSchema.safeParse({
    amountCents: formData.get("amountCents"),
    categoryId: formData.get("categoryId"),
    categorySlug: formData.get("categorySlug"),
    isAnonymous: formData.get("isAnonymous") === "on",
    donorName: formData.get("donorName") ?? undefined,
    donorEmail: formData.get("donorEmail") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const input = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      user_id: user?.id ?? null,
      category_id: input.categoryId,
      amount_cents: input.amountCents,
      is_anonymous: input.isAnonymous,
      donor_name: input.isAnonymous ? null : input.donorName || null,
      donor_email: input.isAnonymous ? null : input.donorEmail || null,
    })
    .select("id")
    .single();

  if (donationError || !donation) {
    return { error: "No pudimos registrar la donación. Intenta de nuevo." };
  }

  const provider = getPaymentProvider();
  const checkout = await provider.createCheckout({
    donationId: donation.id,
    amountCents: input.amountCents,
    currency: "USD",
    categorySlug: input.categorySlug,
    donorEmail: input.donorEmail || undefined,
  });

  if (!checkout.ok) return { error: checkout.error };

  // Registrar la transacción antes de redirigir (idempotente por reference_id)
  await supabase.from("payment_transactions").insert({
    donation_id: donation.id,
    provider: provider.name,
    reference_id: checkout.referenceId,
    status: "pending",
  });

  redirect(checkout.redirectUrl);
}
