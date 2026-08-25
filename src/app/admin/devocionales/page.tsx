import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devocionales · Panel" };

export default async function AdminDevotionalsPage() {
  const supabase = await createClient();
  const { data: devotionals } = await supabase
    .from("devotionals")
    .select("id, slug, title, bible_reading, publish_at, status")
    .order("publish_at", { ascending: false })
    .limit(60);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-anil-800">Devocionales</h1>
        <Link href="/admin/devocionales/importar">
          <Button variant="accent">Importar un mes ↑</Button>
        </Link>
      </div>

      {devotionals?.length ? (
        <div className="overflow-x-auto rounded-[--radius-card] border border-manta">
          <table className="w-full text-left text-sm">
            <thead className="bg-manta text-tinta-suave">
              <tr>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Título</th>
                <th className="px-4 py-2 font-semibold">Lectura</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-manta">
              {devotionals.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-4 py-2">
                    {d.publish_at ? formatDate(d.publish_at) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/devocionales/${d.slug}`} className="hover:underline">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-balsamo-700">{d.bible_reading}</td>
                  <td className="px-4 py-2">
                    <Badge tone={d.status === "published" ? "balsamo" : "neutral"}>{d.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-tinta-suave">
          Aún no hay devocionales cargados. Usa &quot;Importar un mes&quot; para subir el primero.
        </p>
      )}
    </div>
  );
}
