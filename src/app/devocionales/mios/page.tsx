import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis devocionales" };
export const dynamic = "force-dynamic";

type DevotionalSummary = {
  id: string;
  slug: string;
  title: string;
  bible_reading: string | null;
  publish_at: string | null;
};

export default async function MyDevotionalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/devocionales/mios");

  const [{ data: favoriteRows }, { data: readRows }] = await Promise.all([
    supabase
      .from("devotional_favorites")
      .select("devotional_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("devotional_reads")
      .select("devotional_id, read_at")
      .eq("user_id", user.id)
      .order("read_at", { ascending: false })
      .limit(50),
  ]);

  const devotionalIds = Array.from(new Set([
    ...(favoriteRows ?? []).map((row) => row.devotional_id),
    ...(readRows ?? []).map((row) => row.devotional_id),
  ]));

  const devotionalMap = new Map<string, DevotionalSummary>();

  if (devotionalIds.length) {
    const { data: devotionals } = await supabase
      .from("devotionals")
      .select("id, slug, title, bible_reading, publish_at")
      .in("id", devotionalIds)
      .eq("status", "published")
      .lte("publish_at", new Date().toISOString());

    for (const devotional of devotionals ?? []) {
      devotionalMap.set(devotional.id, devotional as DevotionalSummary);
    }
  }

  const favorites = (favoriteRows ?? []).flatMap((row) => {
    const devotional = devotionalMap.get(row.devotional_id);
    return devotional ? [{ at: row.created_at, devotional }] : [];
  });

  const history = (readRows ?? []).flatMap((row) => {
    const devotional = devotionalMap.get(row.devotional_id);
    return devotional ? [{ at: row.read_at, devotional }] : [];
  });

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHero
        title="Mis devocionales"
        subtitle="Tus favoritos y el historial de lo que ya has leído."
      />

      <Link href="/devocionales" className="inline-flex text-sm font-semibold text-anil-600">
        ← Todos los devocionales
      </Link>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-anil-800">Guardados</h2>
          <p className="text-sm text-tinta-suave">Devocionales que quieres conservar para volver a ellos.</p>
        </div>

        {favorites.length ? (
          <ul className="space-y-3">
            {favorites.map(({ at, devotional }) => (
              <li key={devotional.id}>
                <Link href={`/devocionales/${devotional.slug}`}>
                  <Card className="transition-colors hover:border-anil-300">
                    <p className="text-xs font-medium text-tinta-suave">Guardado {formatDate(at)}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{devotional.title}</h3>
                    {devotional.bible_reading ? (
                      <p className="mt-1 text-sm text-balsamo-700">{devotional.bible_reading}</p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no has guardado devocionales."
            hint="Cuando encuentres uno que quieras conservar, toca Guardar."
          />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-anil-800">Historial de lectura</h2>
          <p className="text-sm text-tinta-suave">Los devocionales que has marcado como leídos, del más reciente al más antiguo.</p>
        </div>

        {history.length ? (
          <ul className="space-y-3">
            {history.map(({ at, devotional }) => (
              <li key={devotional.id}>
                <Link href={`/devocionales/${devotional.slug}`}>
                  <Card className="transition-colors hover:border-anil-300">
                    <p className="text-xs font-medium text-tinta-suave">Leído {formatDate(at)}</p>
                    <h3 className="mt-1 font-display text-lg font-semibold">{devotional.title}</h3>
                    {devotional.bible_reading ? (
                      <p className="mt-1 text-sm text-balsamo-700">{devotional.bible_reading}</p>
                    ) : null}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Aún no tienes lecturas en tu historial."
            hint="Marca un devocional como leído y aparecerá aquí."
          />
        )}
      </section>
    </div>
  );
}
