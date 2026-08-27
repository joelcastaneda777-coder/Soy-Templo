"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ episodeId: z.string().uuid() });

async function requireUser(episodeId: unknown) {
  const parsed = schema.safeParse({ episodeId });
  if (!parsed.success) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user, episodeId: parsed.data.episodeId };
}

export async function toggleRadioFavorite(formData: FormData) {
  const ctx = await requireUser(formData.get("episodeId"));
  if (!ctx) return;
  const { data: existing } = await ctx.supabase.from("radio_favorites").select("episode_id").eq("user_id", ctx.user.id).eq("episode_id", ctx.episodeId).maybeSingle();
  if (existing) await ctx.supabase.from("radio_favorites").delete().eq("user_id", ctx.user.id).eq("episode_id", ctx.episodeId);
  else await ctx.supabase.from("radio_favorites").insert({ user_id: ctx.user.id, episode_id: ctx.episodeId });
  revalidatePath("/radio/programas");
}

export async function toggleListenLater(formData: FormData) {
  const ctx = await requireUser(formData.get("episodeId"));
  if (!ctx) return;
  const { data: existing } = await ctx.supabase.from("radio_listen_later").select("episode_id").eq("user_id", ctx.user.id).eq("episode_id", ctx.episodeId).maybeSingle();
  if (existing) await ctx.supabase.from("radio_listen_later").delete().eq("user_id", ctx.user.id).eq("episode_id", ctx.episodeId);
  else await ctx.supabase.from("radio_listen_later").insert({ user_id: ctx.user.id, episode_id: ctx.episodeId });
  revalidatePath("/radio/programas");
}
