import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPlusAccess } from "@/lib/plus/access";
import { EpisodePlayer } from "./episode-player";

export const metadata: Metadata = { title: "Programas · Radio Soy Templo" };

export default async function RadioProgramsPage() {
  const supabase = await createClient();
  const [{ data: programs }, { data: episodes }, access] = await Promise.all([
    supabase.from("radio_programs").select("id,slug,name,description,host_name,cover_url,schedule_text,category,accent_color,is_featured").eq("status", "published").is("deleted_at", null).order("is_featured", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("radio_episodes").select("id,program_id,title,description,access_tier,published_at,duration_seconds").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false }).limit(60),
    getPlusAccess(),
  ]);
  const programMap = new Map((programs ?? []).map((program) => [program.id, program]));

  return (
    <div className="relative left-1/2 -mt-4 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#07100f] pb-28 text-white md:-mt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(91,95,239,.2),transparent_28%),radial-gradient(circle_at_90%_22%,rgba(236,72,153,.12),transparent_24%),linear-gradient(180deg,#07100f,#081513_55%,#06100f)]" />
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><Link href="/radio" className="text-xs font-semibold text-white/45">← Radio en vivo</Link><p className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300/60">Escucha a tu ritmo</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Programas</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">Conversaciones, mensajes y series para acompañarte donde estés.</p></div>{!access.hasAccess ? <Link href="/plus" className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-200">Descubrir Soy Templo+</Link> : null}</div>

        <section className="mt-10">
          {programs?.length ? <div className="radio-stack-scroll flex snap-x gap-[-1rem] overflow-x-auto pb-10 pt-4" style={{ scrollbarWidth: "none" }}>{programs.map((program, index) => { const accent = program.accent_color || "#5B5FEF"; return <Link key={program.id} href={`/radio/programas/${program.slug}`} className="radio-program-card group relative -mr-10 h-[25rem] w-[76vw] max-w-[310px] shrink-0 snap-center overflow-hidden rounded-[2.3rem] border border-white/10 p-6 shadow-[0_28px_60px_rgba(0,0,0,.36)] transition duration-500 hover:z-20 hover:-translate-y-2 sm:-mr-14" style={{ zIndex: programs.length - index, background: `radial-gradient(circle at 25% 12%, ${accent}bb, transparent 32%), radial-gradient(circle at 90% 70%, ${accent}55, transparent 35%), linear-gradient(155deg,#17201f,#07100f 72%)`, animationDelay: `${index * 180}ms` }}><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.05),transparent_35%,rgba(0,0,0,.54))]"/><div className="absolute inset-x-8 top-8 h-28 rounded-[1.7rem] border border-white/10 bg-white/[.035] backdrop-blur-2xl transition duration-500 group-hover:scale-[1.03]"/><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-white/65">{program.category || "Programa"}</span>{program.is_featured ? <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#07100f]">Destacado</span> : null}</div><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Soy Templo Radio</p><h2 className="mt-2 font-display text-3xl font-semibold leading-[1.02]">{program.name}</h2>{program.host_name ? <p className="mt-3 text-sm text-white/60">Con {program.host_name}</p> : null}{program.schedule_text ? <p className="mt-1 text-xs text-white/35">{program.schedule_text}</p> : null}<p className="mt-5 text-xs font-bold text-white/80">Abrir programa →</p></div></div></Link>; })}</div> : <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/45">Todavía no hay programas publicados.</div>}
        </section>

        <section className="mt-6"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Archivo reciente</p><h2 className="mt-1 font-display text-2xl font-semibold">Últimos episodios</h2></div>{episodes?.length ? <div className="grid gap-3 md:grid-cols-2">{episodes.map((episode) => { const program = programMap.get(episode.program_id); const locked = episode.access_tier === "plus" && !access.hasAccess; return <article key={episode.id} className="radio-glass rounded-3xl p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/35"><span>{episode.access_tier === "plus" ? "Soy Templo+" : "Gratis"}</span>{program ? <><span>•</span><Link href={`/radio/programas/${program.slug}`} className="hover:text-white">{program.name}</Link></> : null}</div><h3 className="mt-2 font-display text-xl font-semibold">{episode.title}</h3>{episode.description ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">{episode.description}</p> : null}</div>{episode.duration_seconds ? <span className="shrink-0 text-xs text-white/30">{Math.max(1, Math.round(episode.duration_seconds / 60))} min</span> : null}</div>{locked ? <div className="mt-4 rounded-2xl bg-white/[.035] p-3 text-xs text-white/50">Contenido de Soy Templo+. <Link href="/plus" className="font-bold text-emerald-300">Desbloquear</Link></div> : <EpisodePlayer episodeId={episode.id} />}</article>; })}</div> : <p className="text-sm text-white/40">Aún no hay episodios publicados.</p>}</section>
      </main>
    </div>
  );
}
