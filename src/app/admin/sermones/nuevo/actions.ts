"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToCategory } from "@/lib/push/send";
import { sleep } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(3, "El título es muy corto"),
  description: z.string().trim().max(500).optional(),
  videoUrl: z.string().trim().url("Pega un enlace válido (YouTube, Facebook, etc.)"),
  thumbnailUrl: z.string().trim().url().optional().or(z.literal("")),
  notify: z.coerce.boolean(),
});

export type SermonFormState = { error?: string };

export async function createSermon(_prev: SermonFormState, formData: FormData): Promise<SermonFormState> {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    videoUrl: formData.get("videoUrl"),
    thumbnailUrl: formData.get("thumbnailUrl") || undefined,
    notify: formData.get("notify") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { error: "No tienes permiso para publicar sermones." };

  const { data: sermon, error } = await supabase
    .from("sermons")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      video_url: parsed.data.videoUrl,
      thumbnail_url: parsed.data.thumbnailUrl || null,
      status: "published",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !sermon) return { error: "No se pudo guardar el sermón." };

  if (parsed.data.notify) {
    await sendPushToCategory("sermons", {
      title: "Nuevo sermón disponible",
      body: parsed.data.title,
      url: "/sermones",
      tag: "sermon",
    });
  }

  revalidatePath("/admin/sermones");
  revalidatePath("/sermones");
  await sleep(400);
  redirect("/admin/sermones");
}
