"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sleep } from "@/lib/utils";

const prayerSchema = z.object({
  body: z.string().trim().min(10, "Cuéntanos un poco más para poder orar contigo.").max(2000),
  category: z.enum(["salud", "familia", "provision", "gratitud", "general"]),
  isPublic: z.coerce.boolean(),
  isAnonymous: z.coerce.boolean(),
  allowContact: z.coerce.boolean(),
  contactInfo: z.string().trim().max(200).optional(),
});

export type PrayerFormState = { ok?: boolean; error?: string };

export async function submitPrayerRequest(
  _prev: PrayerFormState,
  formData: FormData
): Promise<PrayerFormState> {
  const parsed = prayerSchema.safeParse({
    body: formData.get("body"),
    category: formData.get("category"),
    isPublic: formData.get("isPublic") === "on",
    isAnonymous: formData.get("isAnonymous") === "on",
    allowContact: formData.get("allowContact") === "on",
    contactInfo: formData.get("contactInfo") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("prayer_requests").insert({
    user_id: user?.id ?? null,
    body: parsed.data.body,
    category: parsed.data.category,
    is_public: parsed.data.isPublic,
    is_anonymous: parsed.data.isAnonymous,
    allow_pastoral_contact: parsed.data.allowContact,
    contact_info: parsed.data.allowContact ? parsed.data.contactInfo || null : null,
    status: "pending", // toda petición pasa por moderación antes de publicarse
  });

  if (error) return { error: "No pudimos enviar tu petición. Intenta de nuevo." };
  await sleep(400);
  revalidatePath("/oracion");
  return { ok: true };
}

export async function markPraying(prayerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("prayer_interactions").upsert({ user_id: user.id, prayer_id: prayerId });
  revalidatePath("/oracion");
}
