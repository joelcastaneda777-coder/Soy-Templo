import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlusAccess } from "@/lib/plus/access";
import { EpisodePlayer } from "./episode-player";
import { toggleListenLater, toggleRadioFavorite } from "./actions";

export const metadata: Metadata = { title: "Programas · Radio Soy Templo" };

export default async function RadioProgramsPage() {
  const supabase = await createClient();
  const [{ data: programs }, { data: episodes }, access, { data: { user } }] = await Promise.all([
    supabase.from("radio_programs").select("id,slug,name,description,host_name,schedule_text").eq("status", "published").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("radio_episodes").select("id,program_id,title,description,access_tier,published_at,duration_seconds").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false }).limit(100),
    getPlusAccess(),
    supabase.auth.getUser(),
  ]);

  const [favoriteResult, laterResult] = user ? await Promise.all([
    supabase.from("radio_favorites").select("episode_id").eq("user_id", user.id),
    supabase.from("radio_listen_later").select("episode_id").eq("user_id", user.id),
  ]) : [{ data: [] }, { data: [] }];
  const favorites = new Set((favoriteResult.data ?? []).map((item) => item.episode_id));
  const listenLater = new Set((laterResult.data ?? []).map((item) => item.episode_id));
  const programMap = new Map((programs ?? []).map((program) => [program.id, program]));

  return (
    <div className="space-y-6">
      <PageHero title="Programas de Radio" subtitle="Escucha el archivo de Soy Templo y guarda lo que quieras volver a oír." />
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-2"><Link href="/radio" className="rounded-full border border-manta px-4 py-2 text-sm font-semibold">← Radio en vivo</Link>{!access.hasAccess ? <Link href="/plus" className="rounded-full bg-anil-600 px-4 py-2 text-sm font-semibold text-white">Conocer Soy Templo+</Link> : null}</div>

        {programs?.length ? <section className="grid gap-3 sm:grid-cols-2">{programs.map((program) => <Card key={program.id}><h2 className="font-display text-xl font-semibold text-anil-900">{program.name}</h2>{program.host_name ? <p className="mt-1 text-sm font-medium">Con {program.host_name}</p> : null}{program.schedule_text ? <p className="mt-1 text-xs text-tinta-suave">{program.schedule_text}</p> : null}{program.description ? <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{program.description}</p> : null}</Card>)}</section> : null}

        <section className="space-y-3">
          <h2 className="font-display text-2xl font-semibold text-anil-800">Últimos episodios</h2>
          {episodes?.length ? <ul className="space-y-3">{episodes.map((episode) => {
            const program = programMap.get(episode.program_id);
            const locked = episode.access_tier === "plus" && !access.hasAccess;
            return <li key={episode.id}><Card><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2">{episode.access_tier === "plus" ? <Badge tone="anil">Soy Templo+</Badge> : <Badge tone="balsamo">Gratis</Badge>}{program ? <Badge>{program.name}</Badge> : null}</div><h3 className="mt-3 font-display text-xl font-semibold">{episode.title}</h3>{episode.description ? <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{episode.description}</p> : null}</div></div>
              {locked ? <div className="mt-4 rounded-2xl bg-anil-50 p-4 text-sm text-anil-900">Este episodio forma parte del archivo de Soy Templo+. <Link href="/plus" className="font-semibold text-anil-600">Ver membresía →</Link></div> : <EpisodePlayer episodeId={episode.id} />}
              {user ? <div className="mt-4 flex flex-wrap gap-2 border-t border-manta pt-3"><form action={toggleRadioFavorite}><input type="hidden" name="episodeId" value={episode.id} /><button className="text-xs font-semibold text-anil-600">{favorites.has(episode.id) ? "★ Quitar de favoritos" : "☆ Favorito"}</button></form><form action={toggleListenLater}><input type="hidden" name="episodeId" value={episode.id} /><button className="text-xs font-semibold text-anil-600">{listenLater.has(episode.id) ? "✓ Guardado para después" : "+ Escuchar después"}</button></form></div> : <p className="mt-4 border-t border-manta pt-3 text-xs text-tinta-suave"><Link href="/auth/login?next=/radio/programas" className="font-semibold text-anil-600">Inicia sesión</Link> para guardar favoritos.</p>}
            </Card></li>;
          })}</ul> : <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm text-tinta-suave">Todavía no hay episodios publicados. La estructura ya está lista para comenzar a cargar programas.</p>}
        </section>
      </div>
    </div>
  );
}
