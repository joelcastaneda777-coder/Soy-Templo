import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlusAccess } from "@/lib/plus/access";
import { EpisodePlayer } from "../episode-player";

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: program }, access] = await Promise.all([
    supabase.from("radio_programs").select("id,slug,name,description,host_name,cover_url,schedule_text,category,accent_color").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle(),
    getPlusAccess(),
  ]);
  if (!program) notFound();

  const { data: episodes } = await supabase.from("radio_episodes").select("id,title,description,access_tier,published_at,duration_seconds").eq("program_id", program.id).eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false });
  const accent = program.accent_color || "#5B5FEF";

  return (
    <div className="relative left-1/2 -mt-4 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#07100f] pb-28 text-white md:-mt-4">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 75% 5%, ${accent}44, transparent 31%), radial-gradient(circle at 0% 48%, ${accent}22, transparent 28%), linear-gradient(180deg,#07100f,#091513 55%,#06100f)` }} />
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <Link href="/radio" className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/65 backdrop-blur-xl">← Radio</Link>
        <section className="radio-glass mt-6 overflow-hidden rounded-[2.2rem] p-6 sm:p-9">
          <div className="grid gap-8 md:grid-cols-[190px_1fr] md:items-end">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}cc, transparent 45%), linear-gradient(145deg,${accent}66,#08100f 70%)` }}>
              <div className="absolute inset-5 rounded-[1.5rem] border border-white/10 bg-white/[.035] backdrop-blur-2xl" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl text-white/80">◉</span></div>
            </div>
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">{program.category || "Programa Soy Templo"}</p><h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{program.name}</h1>{program.host_name ? <p className="mt-3 text-sm text-white/65">Con {program.host_name}</p> : null}{program.schedule_text ? <p className="mt-1 text-xs font-semibold uppercase tracking-[.1em] text-white/35">{program.schedule_text}</p> : null}{program.description ? <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55">{program.description}</p> : null}</div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">A la carta</p><h2 className="mt-1 font-display text-2xl font-semibold">Episodios</h2></div>
          {episodes?.length ? <div className="space-y-3">{episodes.map((episode, index) => { const locked = episode.access_tier === "plus" && !access.hasAccess; return <article key={episode.id} className="radio-glass rounded-3xl p-5 transition hover:bg-white/[.075]" style={{ animationDelay: `${index * 60}ms` }}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/35">{episode.access_tier === "plus" ? "Soy Templo+" : "Gratis"}</p><h3 className="mt-2 font-display text-xl font-semibold">{episode.title}</h3>{episode.description ? <p className="mt-2 text-sm leading-relaxed text-white/45">{episode.description}</p> : null}</div>{episode.duration_seconds ? <span className="shrink-0 text-xs text-white/35">{Math.max(1, Math.round(episode.duration_seconds / 60))} min</span> : null}</div>{locked ? <div className="mt-4 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-xs text-white/55">Este episodio forma parte de Soy Templo+. <Link href="/plus" className="font-bold text-emerald-300">Desbloquear →</Link></div> : <EpisodePlayer episodeId={episode.id} />}</article>; })}</div> : <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/45">Todavía no hay episodios publicados en este programa.</div>}
        </section>
      </main>
    </div>
  );
}
