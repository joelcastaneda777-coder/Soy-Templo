import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getBibleBooks,
  getBibleChapter,
  slugifyBookName,
  BIBLE_VERSIONS,
} from "@/lib/bible/client";
import { VersionSwitcher } from "./version-switcher";

type Params = { version: string; book: string; chapter: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { book, chapter } = await params;
  return { title: `${decodeURIComponent(book)} ${chapter} · Biblia` };
}

export default async function BibleChapterPage({ params }: { params: Promise<Params> }) {
  const { version, book: bookSlug, chapter: chapterParam } = await params;
  const chapterNum = Number(chapterParam);

  if (!BIBLE_VERSIONS.some((v) => v.code === version) || !Number.isInteger(chapterNum) || chapterNum < 1) {
    notFound();
  }

  const [books, chapterData] = await Promise.all([
    getBibleBooks(),
    getBibleChapter(version, bookSlug, chapterNum),
  ]);

  const bookIndex = books.findIndex((b) => slugifyBookName(b.name) === bookSlug);
  const currentBook = books[bookIndex];

  if (!currentBook) notFound();

  // Navegación al capítulo/libro anterior y siguiente
  let prevHref: string | null = null;
  if (chapterNum > 1) {
    prevHref = `/biblia/${version}/${bookSlug}/${chapterNum - 1}`;
  } else if (bookIndex > 0) {
    const prevBook = books[bookIndex - 1]!;
    prevHref = `/biblia/${version}/${slugifyBookName(prevBook.name)}/${prevBook.chapters}`;
  }

  let nextHref: string | null = null;
  if (chapterNum < currentBook.chapters) {
    nextHref = `/biblia/${version}/${bookSlug}/${chapterNum + 1}`;
  } else if (bookIndex < books.length - 1) {
    const nextBook = books[bookIndex + 1]!;
    nextHref = `/biblia/${version}/${slugifyBookName(nextBook.name)}/1`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-4">
      <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-manta bg-papel/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <Link href="/biblia" className="text-sm font-semibold text-anil-600">
          ← Libros
        </Link>
        <VersionSwitcher currentVersion={version} bookSlug={bookSlug} chapter={chapterNum} />
      </div>

      <header>
        <h1 className="font-display text-2xl font-semibold text-anil-800">
          {currentBook.name} {chapterNum}
        </h1>
      </header>

      {chapterData?.vers?.length ? (
        <div className="space-y-2 text-lg leading-relaxed">
          {chapterData.vers.map((v) => (
            <p key={v.number}>
              <sup className="mr-1 font-semibold text-cirio-600">{v.number}</sup>
              {v.verse}
            </p>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pudimos cargar este capítulo."
          hint="Puede ser un problema temporal de conexión — intenta de nuevo en un momento."
        />
      )}

      <nav aria-label="Navegación de capítulos" className="flex items-center justify-between border-t border-manta pt-4">
        {prevHref ? (
          <Link href={prevHref} className="text-sm font-semibold text-anil-600">
            ← Anterior
          </Link>
        ) : <span />}
        {nextHref ? (
          <Link href={nextHref} className="text-sm font-semibold text-anil-600">
            Siguiente →
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
