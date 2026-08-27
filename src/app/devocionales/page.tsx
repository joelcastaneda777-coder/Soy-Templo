import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devocionales" };
export const revalidate = 300;

const PAGE_SIZE = 10;

export default async function DevotionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; p?: string }>;
}) {
  const { q, p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const supabase = await createClient();

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
    <div className="space-y-5">
      <PageHero title={t.nav.devotionals} />

      <form role="search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título o pasaje…"
          aria-label="Buscar devocionales"
          className="w-full rounded-full border border-manta bg-white px-5 py-3"
        />
        <button className="rounded-full bg-anil-600 px-5 font-semibold text-white">Buscar</button>
      </form>

      {error ? <p role="alert" className="text-error">{t.common.error}</p> : null}

      {devotionals?.length ? (
        <ul className="space-y-3">
          {devotionals.map((d, i) => (
            <li key={d.slug} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <Link href={`/devocionales/${d.slug}`}>
                <Card className="transition-colors hover:border-anil-300">
                  <p className="text-xs font-medium text-tinta-suave">{formatDate(d.publish_at!)}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{d.title}</h2>
                  <p className="mt-1 text-sm text-balsamo-700">{d.bible_reading}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t.devotional.empty} />
      )}

      {count && count > PAGE_SIZE ? (
        <nav aria-label="Paginación" className="flex justify-center gap-2">
          {page > 1 ? (
            <Link className="rounded-full border border-manta px-4 py-2 text-sm" href={`?q=${q ?? ""}&p=${page - 1}`}>← Anterior</Link>
          ) : null}
          {page * PAGE_SIZE < count ? (
            <Link className="rounded-full border border-manta px-4 py-2 text-sm" href={`?q=${q ?? ""}&p=${page + 1}`}>Siguiente →</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
