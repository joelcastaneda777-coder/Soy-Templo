"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

const programSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1200).optional(),
  hostName: z.string().trim().max(120).optional(),
  scheduleText: z.string().trim().max(240).optional(),
  status: z.enum(["draft", "published"]),
});

const episodeSchema = z.object({
  programId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1600).optional(),
  sourceUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Usa una URL HTTPS").optional().or(z.literal("")),
  accessTier: z.enum(["free", "plus"]),
  status: z.enum(["draft", "published"]),
});

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) throw new Error("No autorizado");
  return { supabase, user };
}

export async function createRadioProgram(formData: FormData) {
  const parsed = programSchema.safeParse({
    name: formData.get("name"), description: formData.get("description") || undefined,
    hostName: formData.get("hostName") || undefined, scheduleText: formData.get("scheduleText") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { supabase, user } = await requireStaff();
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("radio_programs").insert({
    slug, name: parsed.data.name, description: parsed.data.description || null,
    host_name: parsed.data.hostName || null, schedule_text: parsed.data.scheduleText || null,
    status: parsed.data.status, created_by: user.id,
  });
  if (error) throw new Error(`No pudimos crear el programa: ${error.message}`);
  revalidatePath("/admin/radio"); revalidatePath("/radio/programas");
}

export async function createRadioEpisode(formData: FormData) {
  const parsed = episodeSchema.safeParse({
    programId: formData.get("programId"), title: formData.get("title"),
    description: formData.get("description") || undefined, sourceUrl: formData.get("sourceUrl") || "",
    accessTier: formData.get("accessTier"), status: formData.get("status"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { supabase, user } = await requireStaff();
  const slug = `${slugify(parsed.data.title)}-${Date.now().toString(36)}`;
  const { data: episode, error } = await supabase.from("radio_episodes").insert({
    program_id: parsed.data.programId, slug, title: parsed.data.title,
    description: parsed.data.description || null, access_tier: parsed.data.accessTier,
    status: parsed.data.status, published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    created_by: user.id,
  }).select("id").single();
  if (error || !episode) throw new Error(`No pudimos crear el episodio: ${error?.message ?? "sin ID"}`);

  if (parsed.data.sourceUrl) {
    const { error: sourceError } = await supabase.rpc("set_radio_episode_source", {
      target_episode: episode.id, new_audio_path: null, new_external_url: parsed.data.sourceUrl,
    });
    if (sourceError) {
      await supabase.from("radio_episodes").delete().eq("id", episode.id);
      throw new Error(`No pudimos guardar la fuente del episodio: ${sourceError.message}`);
    }
  }

  revalidatePath("/admin/radio"); revalidatePath("/radio/programas");
}
