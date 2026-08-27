"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sleep } from "@/lib/utils";
import type { ParsedDevotional } from "@/lib/devotionals/parse-markdown";

const rowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  slug: z.string().min(1),
  bibleReading: z.string().min(1),
  keyVerse: z.string().min(1),
  reflection: z.string().min(1),
  application: z.string(),
  questions: z.array(z.string()),
  closingPrayer: z.string().min(1),
});

export type ImportState = {
  ok?: boolean;
  imported?: number;
  error?: string;
};

/**
 * Inserta (o actualiza, si ya existe el mismo slug) un lote de devocionales.
 * Requiere rol editor o admin: la política RLS "staff write devotionals"
 * es la última línea de defensa, pero validamos aquí también para dar
 * un mensaje de error claro en la interfaz.
 */
export async function importDevotionals(rows: ParsedDevotional[]): Promise<ImportState> {
  if (rows.length === 0) {
    return { error: "No hay devocionales válidos para importar." };
  }

  const parsed = z.array(rowSchema).safeParse(rows);
  if (!parsed.success) {
    return { error: "Los datos no tienen el formato esperado. Vuelve a generar la vista previa." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión como editor o administrador." };

  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { error: "Tu cuenta no tiene permisos para publicar devocionales." };

  const payload = parsed.data.map((row) => ({
    slug: row.slug,
    title: row.title,
    bible_reading: row.bibleReading,
    key_verse: row.keyVerse,
    reflection: row.reflection,
    application: row.application || null,
    questions: row.questions.length > 0 ? row.questions : null,
    closing_prayer: row.closingPrayer,
    // 5:00 a. m. hora de El Salvador (UTC-6), para que aparezca como
    // "devocional de hoy" desde temprano cada día.
    publish_at: `${row.date}T05:00:00-06:00`,
    status: "published" as const,
    created_by: user.id,
  }));

  const { error, count } = await supabase
    .from("devotionals")
    .upsert(payload, { onConflict: "slug", count: "exact" });

  if (error) {
    return { error: `No se pudo guardar en la base de datos: ${error.message}` };
  }

  revalidatePath("/admin/devocionales");
  revalidatePath("/devocionales");
  revalidatePath("/");

  await sleep(400);
  return { ok: true, imported: count ?? payload.length };
}
