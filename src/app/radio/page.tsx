import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPlusAccess } from "@/lib/plus/access";
import { RadioPlayer } from "./radio-player";

export const metadata: Metadata = { title: "Radio Soy Templo" };

type RadioSettings = { name?: string; description?: string; stream_url?: string | null };
type Program = { id: string; slug: string; name: string; description: string | null; host_name: string | null; cover_url: string | null; schedule_text: string | null; category?: string | null; accent_color?: string | null; is_featured?: boolean };
type Schedule = { id: string; program_id: string; day_of_week: number; start_time: string; end_time: string; label: string | null; is_live: boolean };

function salvadorClock() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/El_Salvador", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return { day: dayMap[weekday] ?? 0, time: `${hour}:${minute}:00` };
}

function formatTime(value: string) {
  const [h = "0", m = "00"] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "p. m." : "a. m.";
  const display = hour % 12 || 12;
  return `${display}:${m} ${suffix}`;
}

export default async function RadioPage() {
  const supabase = await createClient();
  const clock = salvadorClock();
  const [{ data: settings }, access, programsResult, schedulesResult, episodesResult] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
    getPlusAccess(),
    supabase.from("radio_programs").select("id,slug,name,description,host_name,cover_url,schedule_text,category,accent_color,is_featured").eq("status", "published").is("deleted_at", null).order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(12),
    supabase.from("radio_schedule").select("id,program_id,day_of_week,start_time,end_time,label,is_live").eq("is_active", true).eq("day_of_week", clock.day).order("start_time"),
    supabase.from("radio_episodes").select("id,program_id,slug,title,description,access_tier,published_at,duration_seconds").eq("status", "published").is("deleted_at", null).order("published_at", { ascending: false }).limit(6),
  ]);
  const radio = (settings?.value as RadioSettings | null) ?? {};
  const programs = (programsResult.data ?? []) as Program[];
  const schedules = (schedulesResult.data ?? []) as Schedule[];
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const currentSlot = schedules.find((slot) => slot.start_time <= clock.time && slot.end_time > clock.time) ?? null;
  const nextSlot = schedules.find((slot) => slot.start_time > clock.time) ?? null;
  const currentProgram = currentSlot ? programMap.get(currentSlot.program_id) : null;
  const nextProgram = nextSlot ? programMap.get(nextSlot.program_id) : null;

  const currentShow = currentProgram ? {
    name: currentProgram.name,
    host: currentProgram.host_name,
    coverUrl: currentProgram.cover_url,
    schedule: `${formatTime(currentSlot!.start_time)} – ${formatTime(currentSlot!.end_time)}`,
    isLive: currentSlot!.is_live,
  } : null;
  const nextShow = nextProgram ? {
    name: nextProgram.name,
    host: nextProgram.host_name,
    schedule: `${formatTime(nextSlot!.start_time)} – ${formatTime(nextSlot!.end_time)}`,
    isLive: nextSlot!.is_live,
  } : null;

  return (
    <div className="relative left-1/2 -mt-4 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#07100f] pb-28 text-white md:-mt-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(91,95,239,.22),transparent_28%),radial-gradient(circle_at_90%_35%,rgba(52,211,153,.13),transparent_30%),linear-gradient(180deg,#07100f_0%,#071716_48%,#06100f_100%)]" />
      <main className="relative z-10 mx-auto max-w-6xl space-y-10 px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[11px] font-extrabold uppercase tracking-[.24em] text-emerald-300/70">Audio Soy Templo</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Radio</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{radio.description || "Una señal para acompañarte: música, conversaciones, mensajes y contenido para escuchar cuando quieras."}</p></div>
          <Link href="/radio/programas" className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold text-white/75 backdrop-blur-xl">Biblioteca →</Link>
        </header>

        <RadioPlayer streamUrl={radio.stream_url ?? null} stationName={radio.name || "Soy Templo Radio"} hasBackgroundAccess={access.hasAccess} currentShow={currentShow} nextShow={nextShow} />

        <section>
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Elige qué escuchar</p><h2 className="mt-1 font-display text-2xl font-semibold">Programas</h2></div><Link href="/radio/programas" className="text-xs font-semibold text-emerald-300/80">Ver todos</Link></div>
          {programs.length ? <div className="radio-stack-scroll flex snap-x gap-4 overflow-x-auto pb-5" style={{ scrollbarWidth: "none" }}>{programs.map((program, index) => <Link key={program.id} href={`/radio/programas/${program.slug}`} className="group relative h-72 w-[72vw] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(0,0,0,.28)] transition duration-500 hover:-translate-y-1" style={{ background: `radial-gradient(circle at 80% 12%, ${program.accent_color || "#5B5FEF"}55, transparent 30%), linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.025))`, transform: `translateY(${Math.min(index, 5) * 2}px)` }}><div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.58))]"/><div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/65">{program.category || "Programa"}</span><span className="h-8 w-8 rounded-full border border-white/10 bg-white/5 text-center text-lg leading-7 text-white/55">↗</span></div><div><h3 className="font-display text-2xl font-semibold leading-tight">{program.name}</h3>{program.host_name ? <p className="mt-2 text-xs text-white/55">Con {program.host_name}</p> : null}{program.schedule_text ? <p className="mt-1 text-[11px] text-white/35">{program.schedule_text}</p> : null}</div></div></Link>)}</div> : <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/45">Los programas aparecerán aquí cuando se publiquen desde el panel.</div>}
        </section>

        <section>
          <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Escucha cuando quieras</p><h2 className="mt-1 font-display text-2xl font-semibold">Últimos episodios</h2></div>
          {episodesResult.data?.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{episodesResult.data.map((episode) => { const program = programMap.get(episode.program_id); return <Link key={episode.id} href={`/radio/programas/${program?.slug || ""}`} className="rounded-3xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-xl transition hover:bg-white/[.075]"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/35"><span>{episode.access_tier === "plus" ? "Soy Templo+" : "Gratis"}</span>{program ? <><span>•</span><span>{program.name}</span></> : null}</div><h3 className="mt-3 font-display text-xl font-semibold leading-tight">{episode.title}</h3>{episode.description ? <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/45">{episode.description}</p> : null}<p className="mt-5 text-xs font-bold text-emerald-300/75">Escuchar →</p></Link>; })}</div> : <p className="text-sm text-white/40">Aún no hay episodios publicados.</p>}
        </section>
      </main>
    </div>
  );
}
