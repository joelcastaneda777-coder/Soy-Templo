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
  coverUrl: z.string().trim().url().optional().or(z.literal("")),
  category: z.string().trim().max(80).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
  featured: z.boolean(),
  status: z.enum(["draft", "published"]),
});

const episodeSchema = z.object({
  programId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1600).optional(),
  sourceUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Usa una URL HTTPS").optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  accessTier: z.enum(["free", "plus"]),
  status: z.enum(["draft", "published"]),
});

const scheduleSchema = z.object({
  programId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  label: z.string().trim().max(120).optional(),
  isLive: z.boolean(),
}).refine((value) => value.endTime > value.startTime, { message: "La hora final debe ser posterior a la inicial" });

const stationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  streamUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Usa una URL HTTPS").optional().or(z.literal("")),
});

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) throw new Error("No autorizado");
  return { supabase, user };
}

function refreshRadio() {
  revalidatePath("/admin/radio");
  revalidatePath("/radio");
  revalidatePath("/radio/programas");
}

export async function saveRadioStation(formData: FormData) {
  const parsed = stationSchema.safeParse({ name: formData.get("name"), description: formData.get("description") || undefined, streamUrl: formData.get("streamUrl") || "" });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { supabase, user } = await requireStaff();
  const value = { name: parsed.data.name, description: parsed.data.description || null, stream_url: parsed.data.streamUrl || null };
  const { error } = await supabase.from("app_settings").upsert({ key: "radio", value, updated_by: user.id }, { onConflict: "key" });
  if (error) throw new Error(`No pudimos guardar la estación: ${error.message}`);
  refreshRadio();
}

export async function createRadioProgram(formData: FormData) {
  const parsed = programSchema.safeParse({
    name: formData.get("name"), description: formData.get("description") || undefined,
    hostName: formData.get("hostName") || undefined, scheduleText: formData.get("scheduleText") || undefined,
    coverUrl: formData.get("coverUrl") || "", category: formData.get("category") || undefined,
    accentColor: formData.get("accentColor") || "", featured: formData.get("featured") === "on", status: formData.get("status"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { supabase, user } = await requireStaff();
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  const { error } = await supabase.from("radio_programs").insert({
    slug, name: parsed.data.name, description: parsed.data.description || null,
    host_name: parsed.data.hostName || null, schedule_text: parsed.data.scheduleText || null,
    cover_url: parsed.data.coverUrl || null, category: parsed.data.category || null,
    accent_color: parsed.data.accentColor || null, is_featured: parsed.data.featured,
    status: parsed.data.status, created_by: user.id,
  });
  if (error) throw new Error(`No pudimos crear el programa: ${error.message}`);
  refreshRadio();
}

export async function createRadioEpisode(formData: FormData) {
  const parsed = episodeSchema.safeParse({
    programId: formData.get("programId"), title: formData.get("title"), description: formData.get("description") || undefined,
    sourceUrl: formData.get("sourceUrl") || "", durationMinutes: formData.get("durationMinutes") || undefined,
    accessTier: formData.get("accessTier"), status: formData.get("status"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { supabase, user } = await requireStaff();
  const slug = `${slugify(parsed.data.title)}-${Date.now().toString(36)}`;
  const { data: episode, error } = await supabase.from("radio_episodes").insert({
    program_id: parsed.data.programId, slug, title: parsed.data.title, description: parsed.data.description || null,
    duration_seconds: parsed.data.durationMinutes ? parsed.data.durationMinutes * 60 : null,
    access_tier: parsed.data.accessTier, status: parsed.data.status,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null, created_by: user.id,
  }).select("id").single();
  if (error || !episode) throw new Error(`No pudimos crear el episodio: ${error?.message ?? "sin ID"}`);
  if (parsed.data.sourceUrl) {
    const { error: sourceError } = await supabase.rpc("set_radio_episode_source", { target_episode: episode.id, new_audio_path: null, new_external_url: parsed.data.sourceUrl });
    if (sourceError) { await supabase.from("radio_episodes").delete().eq("id", episode.id); throw new Error(`No pudimos guardar la fuente: ${sourceError.message}`); }
  }
  refreshRadio();
}

export async function createRadioSchedule(formData: FormData) {
  const parsed = scheduleSchema.safeParse({
    programId: formData.get("programId"), dayOfWeek: formData.get("dayOfWeek"), startTime: formData.get("startTime"), endTime: formData.get("endTime"),
    label: formData.get("label") || undefined, isLive: formData.get("isLive") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Horario inválido");
  const { supabase, user } = await requireStaff();
  const { error } = await supabase.from("radio_schedule").insert({
    program_id: parsed.data.programId, day_of_week: parsed.data.dayOfWeek, start_time: parsed.data.startTime,
    end_time: parsed.data.endTime, label: parsed.data.label || null, is_live: parsed.data.isLive, created_by: user.id,
  });
  if (error) throw new Error(`No pudimos crear el horario: ${error.message}`);
  refreshRadio();
}

export async function deleteRadioSchedule(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("radio_schedule").delete().eq("id", id);
  if (error) throw new Error(`No pudimos eliminar el horario: ${error.message}`);
  refreshRadio();
}
