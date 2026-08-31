import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devocionales" };
export const revalidate = 300;

const PAGE_SIZE = 10;
const elSalvadorDate = new Intl.DateTimeFormat("es-SV", {
  timeZone: "America/El_Salvador",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function DevotionalsPage({ searchParams }: { searchParams: Promise<{ q?: string; p?: string }> }) {
  const { q, p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const supabase = await createClient();
  const today = elSalvadorDate.format(new Date());

  let query = supabase
    .from("devotionals")
    .select("slug, title, bible_reading, publish_at, authors(display_name)", { count: "exact" })
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) query = query.or(`title.ilike.%${q}%,bible_reading.ilike.%${q}%`);
  const { data: devotionals, count, error } = await query;

  return (
    <div className="space-y-6">
      <PageHero title={t.nav.devotionals} subtitle="Lecturas breves para volver al centro, escuchar a Dios y caminar con intención." variant="editorial" />

      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#0A6A68]">Biblioteca espiritual</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#063F47]">Para hoy y para volver</h2>
          </div>
          <Link href="/devocionales/mios" className="rounded-full border border-white/70 bg-white/55 px-4 py-2 text-sm font-semibold text-[#063F47] shadow-sm backdrop-blur-xl transition hover:bg-white/80">Mis devocionales</Link>
        </div>

        <form role="search" className="flex gap-2 rounded-[1.7rem] border border-[#063F47]/10 bg-white/60 p-2 shadow-[0_16px_38px_rgba(6,63,71,.08)] backdrop-blur-xl">
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Buscar por título o pasaje…" aria-label="Buscar devocionales" className="min-w-0 flex-1 rounded-[1.2rem] border-0 bg-transparent px-4 py-3 text-[#063F47] outline-none placeholder:text-[#063F47]/40" />
          <button className="rounded-[1.2rem] bg-[#063F47] px-5 font-semibold text-white shadow-[0_8px_22px_rgba(6,63,71,.18)] transition hover:bg-[#0A5559]">Buscar</button>
        </form>

        {error ? <p role="alert" className="text-error">{t.common.error}</p> : null}

        {devotionals?.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {devotionals.map((d, i) => {
              const isToday = !!d.publish_at && elSalvadorDate.format(new Date(d.publish_at)) === today;
              const featured = i === 0 && !q;
              return (
                <li key={d.slug} className={`stagger-item ${featured ? "sm:col-span-2" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                  <Link href={`/devocionales/${d.slug}`} className="group block h-full">
                    <article className={`relative h-full overflow-hidden rounded-[1.8rem] border border-[#063F47]/10 p-5 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#0A6A68]/35 ${featured ? "min-h-56 bg-[radial-gradient(circle_at_88%_20%,rgba(255,255,255,.9),transparent_28%),linear-gradient(145deg,#D8EEE3,#BBDDD0)] shadow-[0_22px_48px_rgba(6,63,71,.12)] sm:p-7" : "bg-white/68 shadow-[0_12px_32px_rgba(6,63,71,.07)] backdrop-blur-xl"}`}>
                      {featured ? <span aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/50 bg-white/20 backdrop-blur-xl" /> : null}
                      <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-[#063F47]/55">
                        <span>{formatDate(d.publish_at!)}</span>
                        {isToday ? <span className="rounded-full border border-[#063F47]/10 bg-white/55 px-2.5 py-1 font-bold text-[#0A6A68]">HOY</span> : null}
                      </div>
                      <h3 className={`${featured ? "mt-5 max-w-xl text-3xl sm:text-4xl" : "mt-3 text-xl"} font-display font-semibold leading-tight tracking-[-0.02em] text-[#063F47]`}>{d.title}</h3>
                      <p className="mt-3 text-sm font-semibold text-[#0A6A68]">{d.bible_reading}</p>
                      <p className="mt-5 text-sm font-semibold text-[#063F47]">Leer devocional <span className="inline-block transition-transform group-hover:translate-x-1">→</span></p>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title={t.devotional.empty} />}

        {count && count > PAGE_SIZE ? (
          <nav aria-label="Paginación" className="flex justify-center gap-2 pt-2">
            {page > 1 ? <Link className="rounded-full border border-[#063F47]/10 bg-white/60 px-4 py-2 text-sm font-semibold text-[#063F47] backdrop-blur-xl" href={`?q=${q ?? ""}&p=${page - 1}`}>← Anterior</Link> : null}
            {page * PAGE_SIZE < count ? <Link className="rounded-full border border-[#063F47]/10 bg-white/60 px-4 py-2 text-sm font-semibold text-[#063F47] backdrop-blur-xl" href={`?q=${q ?? ""}&p=${page + 1}`}>Siguiente →</Link> : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
