import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Sermones" };
export const revalidate = 300;

export default async function SermonsPage() {
  const supabase = await createClient();
  const { data: sermons } = await supabase
    .from("sermons")
    .select("id, title, description, video_url, thumbnail_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-semibold text-anil-800">Sermones</h1>
      {sermons?.length ? (
        <ul className="space-y-4">
          {sermons.map((s) => (
            <li key={s.id}>
              <a href={s.video_url} target="_blank" rel="noopener noreferrer">
                <Card className="transition-colors hover:border-anil-300">
                  <p className="text-xs font-medium text-tinta-suave">{formatDate(s.published_at)}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{s.title}</h2>
                  {s.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-tinta-suave">{s.description}</p>
                  ) : null}
                  <span className="mt-2 inline-block text-sm font-semibold text-anil-600">Ver mensaje →</span>
                </Card>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Aún no hay sermones publicados." />
      )}
    </div>
  );
}
