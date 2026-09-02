import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devocionales · Panel" };

export default async function AdminDevotionalsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = await searchParams;
  const supabase = await createClient();
  const { data: devotionals } = await supabase
    .from("devotionals")
    .select("id, slug, title, bible_reading, publish_at, status")
    .order("publish_at", { ascending: false })
    .limit(60);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-anil-800">Devocionales</h1>
          <p className="mt-1 text-sm text-tinta-suave">Publica una reflexión puntual o prepara el calendario completo del mes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/devocionales/nuevo">
            <Button>+ Nuevo devocional</Button>
          </Link>
          <Link href="/admin/devocionales/importar">
            <Button variant="accent">Importar un mes ↑</Button>
          </Link>
        </div>
      </div>

      {created === "1" ? (
        <div className="rounded-2xl border border-[#0A6A68]/20 bg-[#DDF0E8] px-4 py-3 text-sm font-semibold text-[#063F47]">Devocional guardado correctamente. Ya puedes abrirlo desde la lista según su estado y fecha.</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/devocionales/nuevo" className="rounded-[1.7rem] border border-[#063F47]/10 bg-[linear-gradient(145deg,#DDF0E8,#C8E5DA)] p-5 shadow-[0_14px_34px_rgba(6,63,71,.08)] transition hover:-translate-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Publicación rápida</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-[#063F47]">Nuevo devocional individual</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#063F47]/70">Para palabras pastorales, fechas especiales o reflexiones que necesites publicar hoy sin rehacer el archivo mensual.</p>
        </Link>
        <Link href="/admin/devocionales/importar" className="rounded-[1.7rem] border border-[#063F47]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Calendario editorial</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-[#063F47]">Importar un mes</h2>
          <p className="mt-2 text-sm leading-relaxed text-tinta-suave">Conserva el flujo por Markdown para cargar y programar todo el mes de una sola vez.</p>
        </Link>
      </div>

      {devotionals?.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-manta">
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
                  <td className="whitespace-nowrap px-4 py-2">{d.publish_at ? formatDate(d.publish_at) : "—"}</td>
                  <td className="px-4 py-2">
                    <Link href={`/devocionales/${d.slug}`} className="hover:underline">{d.title}</Link>
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
        <p className="text-tinta-suave">Aún no hay devocionales cargados.</p>
      )}
    </div>
  );
}
