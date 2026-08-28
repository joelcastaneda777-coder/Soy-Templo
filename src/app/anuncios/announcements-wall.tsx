"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { colorForCategory } from "@/lib/announcements/category-colors";

export type WallAnnouncement = {
  id: string;
  title: string;
  description: string;
  category: string;
  kind: string;
  imageUrl: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  featured: boolean;
  effectiveAt: string;
  effectiveUntil: string | null;
};

const KIND_LABELS: Record<string, string> = {
  aviso: "Aviso",
  cambio: "Cambio",
  cancelacion: "Cancelación",
  recordatorio: "Recordatorio",
  campana: "Campaña",
  convocatoria: "Convocatoria",
  clima: "Clima",
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const TZ = "America/El_Salvador";

function parts(iso: string) {
  const tokens = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const get = (type: string) => Number(tokens.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dateLabel(item: WallAnnouncement) {
  const start = parts(item.effectiveAt);
  if (!item.effectiveUntil) return { day: String(start.day).padStart(2, "0"), month: MONTHS[start.month - 1]?.slice(0, 3).toUpperCase() ?? "", range: null };
  const end = parts(item.effectiveUntil);
  const range = start.month === end.month ? `${start.day}–${end.day} ${MONTHS[start.month - 1]?.slice(0,3).toUpperCase()}` : `${start.day} ${MONTHS[start.month - 1]?.slice(0,3).toUpperCase()} – ${end.day} ${MONTHS[end.month - 1]?.slice(0,3).toUpperCase()}`;
  return { day: String(start.day).padStart(2, "0"), month: MONTHS[start.month - 1]?.slice(0, 3).toUpperCase() ?? "", range };
}

export function AnnouncementsWall({ year, month, announcements }: { year: number; month: number; announcements: WallAnnouncement[] }) {
  const router = useRouter();
  function go(delta: number) {
    const target = new Date(year, month - 1 + delta, 1);
    router.push(`/anuncios?y=${target.getFullYear()}&m=${target.getMonth() + 1}`);
  }

  return (
    <section className="relative left-1/2 -mt-4 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(161,201,180,0.38),transparent_34%),linear-gradient(180deg,#eaf3ec_0%,#f7f5ef_100%)] text-[#173b32]">
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-8 md:px-6 md:pb-14 md:pt-10">
        <header className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#55766d]">Mural Soy Templo</p>
            <h1 className="mt-1 font-display text-4xl font-semibold">Anuncios</h1>
            <p className="mt-2 max-w-xl text-sm text-[#55766d]">Cambios, avisos, campañas y noticias que necesitas tener presentes.</p>
          </div>
          <span className="rounded-full border border-[#173b32]/10 bg-white/55 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-xl">{announcements.length} este mes</span>
        </header>

        <div className="mb-7 flex items-center justify-between rounded-[1.7rem] border border-white/70 bg-white/45 p-2.5 shadow-[0_16px_45px_rgba(34,70,58,0.08)] backdrop-blur-xl">
          <button type="button" onClick={() => go(-1)} className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/70">←</button>
          <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6e8a82]">{year}</p><h2 className="font-display text-2xl font-semibold">{MONTHS[month - 1]}</h2></div>
          <button type="button" onClick={() => go(1)} className="rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-white/70">→</button>
        </div>

        {announcements.length ? (
          <div className="relative">
            <div className="absolute bottom-0 left-[3.05rem] top-0 w-px bg-[#315e51]/15 sm:left-[4.15rem]" aria-hidden="true" />
            <div className="space-y-5">
              {announcements.map((announcement, index) => {
                const color = colorForCategory(announcement.category);
                const date = dateLabel(announcement);
                return (
                  <article key={announcement.id} className="stagger-item relative grid grid-cols-[4.4rem_minmax(0,1fr)] gap-3 sm:grid-cols-[6.2rem_minmax(0,1fr)] sm:gap-5" style={{ animationDelay: `${index * 55}ms` }}>
                    <div className="relative z-10 flex flex-col items-center pt-3 text-center">
                      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full border border-white/75 bg-white/80 shadow-[0_8px_24px_rgba(25,62,51,0.12)] backdrop-blur-xl sm:h-16 sm:w-16">
                        <span className="font-display text-xl font-semibold leading-none sm:text-2xl">{date.day}</span>
                        <span className="mt-1 text-[9px] font-bold tracking-[0.15em] text-[#6f877f]">{date.month}</span>
                      </div>
                      {date.range ? <span className="mt-2 max-w-[5.5rem] text-[9px] font-semibold uppercase leading-tight text-[#70877f]">{date.range}</span> : null}
                    </div>

                    <div className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_22px_60px_rgba(38,76,64,0.12)] backdrop-blur-2xl">
                      {announcement.imageUrl ? (
                        <div className="relative min-h-52 overflow-hidden sm:min-h-64">
                          <img src={announcement.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#102f29]/88 via-[#173b32]/28 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                            <AnnouncementBody announcement={announcement} color={color} dark />
                          </div>
                        </div>
                      ) : (
                        <div className="relative min-h-52 p-5 sm:p-6" style={{ background: `linear-gradient(145deg, ${color}24 0%, rgba(255,255,255,.72) 50%, ${color}16 100%)` }}>
                          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-25 blur-2xl" style={{ backgroundColor: color }} aria-hidden="true" />
                          <AnnouncementBody announcement={announcement} color={color} />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/70 bg-white/50 p-10 text-center shadow-sm backdrop-blur-xl"><p className="font-display text-2xl font-semibold">No hay anuncios en este mes.</p><p className="mt-2 text-sm text-[#678078]">Puedes navegar a otro mes para consultar el archivo.</p></div>
        )}
      </div>
    </section>
  );
}

function AnnouncementBody({ announcement, color, dark = false }: { announcement: WallAnnouncement; color: string; dark?: boolean }) {
  return <div className="relative">
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${dark ? "border-white/30 bg-white/15 text-white" : "border-black/5 bg-white/55 text-[#31584e]"}`}>{KIND_LABELS[announcement.kind] ?? announcement.kind}</span>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: dark ? "white" : color }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{announcement.category}</span>
      {announcement.featured ? <span className={dark ? "text-[10px] font-bold text-white/85" : "text-[10px] font-bold text-[#31584e]"}>★ Destacado</span> : null}
    </div>
    <h3 className="mt-4 font-display text-2xl font-semibold leading-tight sm:text-3xl">{announcement.title}</h3>
    <p className={`mt-2 max-w-2xl text-sm leading-relaxed sm:text-base ${dark ? "text-white/82" : "text-[#4e6c63]"}`}>{announcement.description}</p>
    {announcement.actionUrl && announcement.actionLabel ? <Link href={announcement.actionUrl} className={`mt-5 inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition ${dark ? "border-white/30 bg-white/15 text-white hover:bg-white/22" : "border-[#173b32]/10 bg-white/65 text-[#173b32] hover:bg-white"}`}>{announcement.actionLabel} →</Link> : null}
  </div>;
}
