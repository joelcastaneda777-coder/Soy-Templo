"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendPushToCategory } from "@/lib/push/send";

const schema = z.object({
  title: z.string().trim().min(3, "El título es muy corto").max(80),
  body: z.string().trim().min(5, "Escribe un mensaje un poco más largo").max(200),
  categorySlug: z.string().trim().optional(),
});

export type CampaignPushState = { ok?: boolean; sent?: number; error?: string };

export async function sendCampaignPush(
  _prev: CampaignPushState,
  formData: FormData
): Promise<CampaignPushState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    categorySlug: formData.get("categorySlug") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { error: "No tienes permiso para enviar notificaciones." };

  const url = parsed.data.categorySlug ? `/donar?categoria=${parsed.data.categorySlug}` : "/donar";

  const { sent } = await sendPushToCategory("campaigns", {
    title: parsed.data.title,
    body: parsed.data.body,
    url,
    tag: "campaign",
  });

  return { ok: true, sent };
}
