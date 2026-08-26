import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";
import { formatDate } from "@/lib/utils";
import { DevotionalActions } from "./actions-bar";

export const revalidate = 300;

async function getDevotional(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("devotionals")
    .select("*, authors(display_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDevotional(slug);
  if (!d) return {};
  return {
    title: d.title,
    description: d.key_verse,
    openGraph: { title: d.title, description: d.key_verse },
  };
}

export default async function DevotionalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const devotional = await getDevotional(slug);
  if (!devotional) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-tinta-suave">
          {formatDate(devotional.publish_at ?? devotional.created_at)}
          {devotional.authors ? ` · ${t.common.by} ${devotional.authors.display_name}` : null}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-anil-800">{devotional.title}</h1>
        <p className="mt-2 font-semibold text-balsamo-700">
          {t.devotional.reading}: {devotional.bible_reading}
        </p>
      </header>

      <div className="verse-band rounded-[var(--radius-card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cirio-100">
          {t.devotional.keyVerse}
        </p>
        <p className="mt-2 font-display text-xl italic leading-relaxed">{devotional.key_verse}</p>
      </div>

      <section className="space-y-4 text-lg leading-relaxed">
        {devotional.reflection.split("\n\n").map((paragraph: string, i: number) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      {devotional.application ? (
        <section className="rounded-[var(--radius-card)] bg-balsamo-100 p-5">
          <h2 className="font-display text-lg font-semibold text-balsamo-700">
            {t.devotional.application}
          </h2>
          <p className="mt-2 leading-relaxed">{devotional.application}</p>
        </section>
      ) : null}

      {devotional.questions?.length ? (
        <section>
          <h2 className="font-display text-lg font-semibold text-anil-800">{t.devotional.questions}</h2>
          <ul className="mt-2 space-y-2">
            {devotional.questions.map((question: string, i: number) => (
              <li key={i} className="rounded-xl border border-manta bg-white p-4 dark:bg-manta">
                {question}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {devotional.closing_prayer ? (
        <section className="border-l-4 border-cirio-500 pl-4">
          <h2 className="font-display text-lg font-semibold text-cirio-600">{t.devotional.prayer}</h2>
          <p className="mt-2 italic leading-relaxed">{devotional.closing_prayer}</p>
        </section>
      ) : null}

      <DevotionalActions devotionalId={devotional.id} title={devotional.title} isLoggedIn={!!user} />
    </article>
  );
}
