"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(2).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bibleReading: z.string().trim().min(2).max(180),
  keyVerse: z.string().trim().min(2).max(1200),
  reflection: z.string().trim().min(20).max(20000),
  application: z.string().trim().max(5000).optional(),
  closingPrayer: z.string().trim().max(5000).optional(),
  authorId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["draft", "scheduled", "published"]),
  replaceExisting: z.boolean(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);
}

export async function createIndividualDevotional(formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    bibleReading: formData.get("bibleReading"),
    keyVerse: formData.get("keyVerse"),
    reflection: formData.get("reflection"),
    application: formData.get("application") || undefined,
    closingPrayer: formData.get("closingPrayer") || undefined,
    authorId: formData.get("authorId") || "",
    status: formData.get("status"),
    replaceExisting: formData.get("replaceExisting") === "on",
  });

  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Revisa los datos del devocional.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para publicar devocionales.");

  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) throw new Error("Tu cuenta no tiene permisos para publicar devocionales.");

  const data = parsed.data;
  const publishAt = `${data.date}T05:00:00-06:00`;

  if (data.replaceExisting) {
    const start = new Date(`${data.date}T00:00:00-06:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const { error: archiveError } = await supabase
      .from("devotionals")
      .update({ status: "archived" })
      .gte("publish_at", start.toISOString())
      .lt("publish_at", end.toISOString())
      .neq("status", "archived");
    if (archiveError) throw new Error(`No se pudo reemplazar el devocional existente: ${archiveError.message}`);
  }

  const questions = String(formData.get("questions") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);

  const slug = `${slugify(data.title)}-${data.date}`;
  const { error } = await supabase.from("devotionals").upsert({
    slug,
    title: data.title,
    author_id: data.authorId || null,
    bible_reading: data.bibleReading,
    key_verse: data.keyVerse,
    reflection: data.reflection,
    application: data.application || null,
    questions: questions.length ? questions : null,
    closing_prayer: data.closingPrayer || null,
    status: data.status,
    publish_at: publishAt,
    created_by: user.id,
  }, { onConflict: "slug" });

  if (error) throw new Error(`No se pudo guardar el devocional: ${error.message}`);

  revalidatePath("/admin/devocionales");
  revalidatePath("/devocionales");
  revalidatePath("/");
  redirect("/admin/devocionales?created=1");
}
