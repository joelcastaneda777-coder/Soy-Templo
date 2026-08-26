import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Sermones · Panel" };

export default async function AdminSermonsPage() {
  const supabase = await createClient();
  const { data: sermons } = await supabase
    .from("sermons")
    .select("id, title, status, published_at, video_url")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-anil-800">Sermones</h1>
        <Link href="/admin/sermones/nuevo">
          <Button variant="accent">Publicar sermón +</Button>
        </Link>
      </div>

      {sermons?.length ? (
        <div className="overflow-x-auto rounded-[--radius-card] border border-manta">
          <table className="w-full text-left text-sm">
            <thead className="bg-manta text-tinta-suave">
              <tr>
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Título</th>
                <th className="px-4 py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-manta">
              {sermons.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap px-4 py-2">{formatDate(s.published_at)}</td>
                  <td className="px-4 py-2">
                    <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {s.title}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={s.status === "published" ? "balsamo" : "neutral"}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-tinta-suave">Aún no has publicado ningún sermón.</p>
      )}
    </div>
  );
}
