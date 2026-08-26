"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(3, "Escribe un título."),
  description: z.string().trim().min(5, "Escribe una descripción."),
  category: z.string().trim().min(1),
  priority: z.coerce.number().int().min(0).max(100),
  publishAt: z.string().trim().min(1, "Selecciona la fecha y hora de publicación."),
  expiresAt: z.string().trim().optional(),
  actionLabel: z.string().trim().optional(),
  actionUrl: z.string().trim().optional(),
});

export type AnnouncementState = { ok?: boolean; error?: string };

function localToIsoWithOffset(value: string) {
  return value ? `${value.length === 16 ? value + ":00" : value}-06:00` : null;
}

export async function createAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority") || 0,
    publishAt: formData.get("publishAt"),
    expiresAt: formData.get("expiresAt") || undefined,
    actionLabel: formData.get("actionLabel") || undefined,
    actionUrl: formData.get("actionUrl") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };

  if (parsed.data.actionUrl && !/^https?:\/\//i.test(parsed.data.actionUrl) && !parsed.data.actionUrl.startsWith("/")) {
    return { error: "El enlace debe comenzar con https:// o con /." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { error: "No tienes permiso para publicar anuncios." };

  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    priority: parsed.data.priority,
    publish_at: localToIsoWithOffset(parsed.data.publishAt),
    expires_at: parsed.data.expiresAt ? localToIsoWithOffset(parsed.data.expiresAt) : null,
    action_label: parsed.data.actionLabel || null,
    action_url: parsed.data.actionUrl || null,
    status: "published",
    created_by: user.id,
  });

  if (error) return { error: `No se pudo guardar el anuncio: ${error.message}` };

  revalidatePath("/admin/anuncios");
  revalidatePath("/anuncios");
  revalidatePath("/");
  return { ok: true };
}
