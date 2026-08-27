import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Card } from "@/components/ui/card";
import { getBibleBooks, slugifyBookName } from "@/lib/bible/client";
import { DEFAULT_ESBIBLIA_VERSION } from "@/lib/bible/esbiblia";

export const metadata: Metadata = { title: "Biblia" };
export const revalidate = 86400;

export default async function BiblePage() {
  const books = await getBibleBooks();
  const oldTestament = books.filter((b) => b.testament === "Antiguo Testamento");
  const newTestament = books.filter((b) => b.testament === "Nuevo Testamento");

  return (
    <div className="space-y-6">
      <PageHero title="Biblia" subtitle="Elige un libro para empezar a leer." />

      <div className="mx-auto max-w-3xl space-y-8">
        <BookGroup title="Antiguo Testamento" books={oldTestament} />
        <BookGroup title="Nuevo Testamento" books={newTestament} />
      </div>
    </div>
  );
}

function BookGroup({ title, books }: { title: string; books: { name: string }[] }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold text-anil-800">{title}</h2>
      <Card className="p-0">
        <ul className="grid grid-cols-2 divide-y divide-manta sm:grid-cols-3">
          {books.map((book, i) => (
            <li
              key={book.name}
              className={i % 2 === 0 ? "border-r border-manta sm:border-r-0" : ""}
            >
              <Link
                href={`/biblia/${DEFAULT_ESBIBLIA_VERSION}/${slugifyBookName(book.name)}/1`}
                className="flex min-h-12 items-center px-4 py-2 text-sm font-medium hover:bg-anil-50"
              >
                {book.name}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
