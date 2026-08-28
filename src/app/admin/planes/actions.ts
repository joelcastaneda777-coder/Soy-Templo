"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ParsedPlan } from "@/lib/plans/parse-markdown";

const lessonSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
  bibleReading: z.string().min(1),
  explanation: z.string().min(1),
  questions: z.array(z.string()),
  activity: z.string(),
  prayer: z.string(),
});

const planSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(1),
  description: z.string().min(5),
  durationDays: z.number().int().positive(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  topic: z.string().min(1),
  accessTier: z.enum(["free", "plus"]),
  lessons: z.array(lessonSchema).min(1),
});

const visualSchema = z.object({
  planId: z.string().uuid(),
  visualTheme: z.enum(["faith", "fear", "hope", "sadness", "joy", "grace", "identity", "wisdom", "rest", "theology"]),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  coverImageUrl: z.string().max(500).optional(),
});

export type ImportPlansState = { ok?: boolean; imported?: number; error?: string };

async function getAuthorizedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, authorized: false };
  const { data: isStaff } = await supabase.rpc("is_staff");
  return { supabase, authorized: Boolean(isStaff) };
}

export async function updatePlanAppearance(formData: FormData) {
  const parsed = visualSchema.safeParse({
    planId: formData.get("planId"),
    visualTheme: formData.get("visualTheme"),
    accentColor: formData.get("accentColor"),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || undefined,
  });
  if (!parsed.success) return;

  const { supabase, authorized } = await getAuthorizedClient();
  if (!authorized) return;

  await supabase
    .from("bible_plans")
    .update({
      visual_theme: parsed.data.visualTheme,
      accent_color: parsed.data.accentColor.toUpperCase(),
      cover_image_url: parsed.data.coverImageUrl ?? null,
    })
    .eq("id", parsed.data.planId);

  revalidatePath("/admin/planes");
  revalidatePath("/planes");
}

export async function importPlans(rows: ParsedPlan[]): Promise<ImportPlansState> {
  const parsed = z.array(planSchema).safeParse(rows);
  if (!parsed.success || parsed.data.length === 0) return { error: "No hay planes válidos para importar." };

  const { supabase, authorized } = await getAuthorizedClient();
  if (!authorized) return { error: "No tienes permiso para publicar planes." };

  const { data: defaultAuthor } = await supabase
    .from("authors")
    .select("id")
    .eq("display_name", "Pastores Soy Templo")
    .maybeSingle();

  let imported = 0;
  for (const plan of parsed.data) {
    const { data: existing } = await supabase
      .from("bible_plans")
      .select("id")
      .eq("slug", plan.slug)
      .maybeSingle();

    if (existing) {
      return { error: `Ya existe un plan llamado “${plan.name}”. Cambia el nombre antes de importarlo para no borrar el progreso de usuarios.` };
    }

    const { data: savedPlan, error: planError } = await supabase
      .from("bible_plans")
      .insert({
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        duration_days: plan.durationDays,
        level: plan.level,
        topic: plan.topic,
        access_tier: plan.accessTier,
        status: "published",
        author_id: defaultAuthor?.id ?? null,
      })
      .select("id")
      .single();

    if (planError || !savedPlan) {
      return {
        error: `No se pudo guardar el plan “${plan.name}”.${planError?.message ? ` ${planError.message}` : ""}`,
      };
    }

    const { error: lessonsError } = await supabase.from("bible_plan_lessons").insert(
      plan.lessons.map((lesson) => ({
        plan_id: savedPlan.id,
        position: lesson.position,
        title: lesson.title,
        bible_reading: lesson.bibleReading,
        explanation: lesson.explanation,
        questions: lesson.questions.length ? lesson.questions : null,
        activity: lesson.activity || null,
        prayer: lesson.prayer || null,
      }))
    );
    if (lessonsError) {
      await supabase.from("bible_plans").delete().eq("id", savedPlan.id);
      return {
        error: `No se pudieron guardar las lecciones de “${plan.name}”. ${lessonsError.message}`,
      };
    }
    imported += 1;
  }

  revalidatePath("/admin/planes");
  revalidatePath("/planes");
  revalidatePath("/plus");
  return { ok: true, imported };
}
