import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createIndividualDevotional } from "./actions";

export const metadata: Metadata = { title: "Nuevo devocional · Panel" };

function todayInElSalvador() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/El_Salvador",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export default async function NewDevotionalPage() {
  const supabase = await createClient();
  const [{ data: isStaff }, { data: authors }] = await Promise.all([
    supabase.rpc("is_staff"),
    supabase.from("authors").select("id,display_name").is("deleted_at", null).order("display_name"),
  ]);

  if (!isStaff) {
    return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">No tienes permiso para publicar devocionales.</p>;
  }

  const today = todayInElSalvador();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0A6A68]">Publicación editorial</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-[#063F47]">Nuevo devocional individual</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">Publica una reflexión puntual sin alterar la carga mensual por Markdown. Ideal para palabras pastorales, fechas especiales y contenido de último momento.</p>
        </div>
        <Link href="/admin/devocionales" className="rounded-full border border-[#063F47]/15 bg-white px-4 py-2 text-sm font-semibold text-[#063F47]">← Volver</Link>
      </div>

      <form action={createIndividualDevotional} className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="space-y-4 rounded-[2rem] border border-[#063F47]/10 bg-white/80 p-5 shadow-[0_18px_42px_rgba(6,63,71,.08)] backdrop-blur-xl sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Contenido</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#063F47]">La reflexión</h2>
          </div>

          <label className="block text-sm font-semibold text-[#063F47]">Título
            <input name="title" required maxLength={180} placeholder="Mi Padre le honrará" className="mt-1.5 min-h-12 w-full rounded-2xl border border-[#063F47]/12 bg-white px-4 outline-none focus:border-[#0A6A68]" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#063F47]">Lectura bíblica
              <input name="bibleReading" required maxLength={180} placeholder="Juan 12:26" className="mt-1.5 min-h-12 w-full rounded-2xl border border-[#063F47]/12 bg-white px-4 outline-none focus:border-[#0A6A68]" />
            </label>
            <label className="block text-sm font-semibold text-[#063F47]">Fecha
              <input name="date" type="date" required defaultValue={today} className="mt-1.5 min-h-12 w-full rounded-2xl border border-[#063F47]/12 bg-white px-4 outline-none focus:border-[#0A6A68]" />
            </label>
          </div>

          <label className="block text-sm font-semibold text-[#063F47]">Versículo clave
            <textarea name="keyVerse" required rows={3} maxLength={1200} placeholder="Quien quiera servirme debe seguirme... — Juan 12:26" className="mt-1.5 w-full rounded-2xl border border-[#063F47]/12 bg-white p-4 outline-none focus:border-[#0A6A68]" />
          </label>

          <label className="block text-sm font-semibold text-[#063F47]">Reflexión
            <textarea name="reflection" required rows={13} maxLength={20000} placeholder="Puedes escribir o pegar aquí el texto del pastor. Se guarda como contenido Markdown." className="mt-1.5 w-full rounded-2xl border border-[#063F47]/12 bg-white p-4 font-mono text-sm leading-relaxed outline-none focus:border-[#0A6A68]" />
          </label>

          <label className="block text-sm font-semibold text-[#063F47]">Aplicación práctica <span className="font-normal text-tinta-suave">(opcional)</span>
            <textarea name="application" rows={4} maxLength={5000} placeholder="Una idea breve para llevar la reflexión a la vida diaria." className="mt-1.5 w-full rounded-2xl border border-[#063F47]/12 bg-white p-4 outline-none focus:border-[#0A6A68]" />
          </label>

          <label className="block text-sm font-semibold text-[#063F47]">Preguntas para meditar <span className="font-normal text-tinta-suave">(una por línea)</span>
            <textarea name="questions" rows={4} placeholder="¿Estoy sirviendo por reconocimiento o por seguir a Jesús?" className="mt-1.5 w-full rounded-2xl border border-[#063F47]/12 bg-white p-4 outline-none focus:border-[#0A6A68]" />
          </label>

          <label className="block text-sm font-semibold text-[#063F47]">Oración final <span className="font-normal text-tinta-suave">(opcional)</span>
            <textarea name="closingPrayer" rows={5} maxLength={5000} placeholder="Señor, enséñame a servir como Tú..." className="mt-1.5 w-full rounded-2xl border border-[#063F47]/12 bg-white p-4 outline-none focus:border-[#0A6A68]" />
          </label>
        </section>

        <aside className="space-y-5">
          <section className="space-y-4 rounded-[2rem] border border-[#063F47]/10 bg-[linear-gradient(145deg,#DDF0E8,#C6E4D8)] p-5 shadow-[0_18px_42px_rgba(6,63,71,.08)]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Publicación</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-[#063F47]">Cómo aparecerá</h2>
            </div>

            <label className="block text-sm font-semibold text-[#063F47]">Autor
              <select name="authorId" className="mt-1.5 min-h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4">
                <option value="">Soy Templo / sin autor específico</option>
                {(authors ?? []).map((author) => <option key={author.id} value={author.id}>{author.display_name}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#063F47]">Estado
              <select name="status" defaultValue="published" className="mt-1.5 min-h-12 w-full rounded-2xl border border-white/70 bg-white/75 px-4">
                <option value="published">Publicado</option>
                <option value="scheduled">Programado</option>
                <option value="draft">Borrador</option>
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/55 p-4 text-sm text-[#063F47]">
              <input name="replaceExisting" type="checkbox" className="mt-1" />
              <span><strong>Reemplazar el devocional de esa fecha</strong><br /><span className="text-xs text-[#063F47]/65">Archiva el contenido previamente programado para ese día y deja este como principal.</span></span>
            </label>

            <div className="rounded-2xl border border-white/70 bg-white/45 p-4 text-xs leading-relaxed text-[#063F47]/75">
              Los devocionales se programan a las <strong>5:00 a. m. hora de El Salvador</strong>, igual que la carga mensual.
            </div>
          </section>

          <button className="min-h-12 w-full rounded-full bg-[#063F47] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(6,63,71,.22)] transition hover:bg-[#0A5559]">Guardar devocional</button>

          <Link href="/admin/devocionales/importar" className="block rounded-[1.6rem] border border-[#063F47]/10 bg-white/70 p-4 text-sm text-[#063F47] shadow-sm">
            <strong>Carga mensual por Markdown →</strong>
            <span className="mt-1 block text-xs text-tinta-suave">El importador de siempre continúa disponible sin cambios.</span>
          </Link>
        </aside>
      </form>
    </div>
  );
}
