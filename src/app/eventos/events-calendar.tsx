"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { colorForCategory } from "@/lib/announcements/category-colors";
import { dateKeyFromIso, formatEventTime, shiftMonth } from "@/lib/events/calendar";

export type CalendarEvent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  imageUrl: string | null;
  capacity: number | null;
  registeredCount: number;
  attendanceMode: string;
  featured: boolean;
  category: { slug: string; name: string; colorHex: string };
  ministryName: string | null;
};

export type AgendaAnnouncement = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
  featured: boolean;
};

const WEEK = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function EventsCalendar({
  month,
  initialSelectedDate,
  today,
  events,
  announcements,
  monthImageSrc,
}: {
  month: string;
  initialSelectedDate: string;
  today: string;
  events: CalendarEvent[];
  announcements: AgendaAnnouncement[];
  monthImageSrc: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const monthParts = month.split("-");
  const year = Number(monthParts[0] ?? 1970);
  const monthNumber = Number(monthParts[1] ?? 1);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const firstOffset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("es-SV", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(firstDay);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dateKeyFromIso(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedLabel = new Intl.DateTimeFormat("es-SV", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${selectedDate}T12:00:00Z`));

  function chooseDay(key: string) {
    setSelectedDate(key);
    setJustSelected(key);
    router.replace(`/eventos?month=${month}&date=${key}`, { scroll: false });
    window.setTimeout(() => setJustSelected(null), 300);
  }

  function go(delta: number) {
    const target = shiftMonth(month, delta);
    router.push(`/eventos?month=${target}`);
  }

  return (
    <section className="relative left-1/2 -mt-4 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden md:-mt-4 md:min-h-[calc(100dvh-4rem)]">
      <Image
        key={monthImageSrc}
        src={monthImageSrc}
        alt=""
        fill
        sizes="100vw"
        className="animate-month-fade object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,16,17,0.16)_0%,rgba(2,16,17,0.04)_38%,rgba(2,16,17,0.38)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 pb-28 pt-7 md:px-6 md:pb-14 md:pt-9">
        <header className="mb-4 flex items-end justify-between gap-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Agenda Soy Templo</p>
            <h1 className="mt-1 font-display text-3xl font-semibold capitalize drop-shadow-sm">{monthLabel}</h1>
            <p className="mt-1 max-w-lg text-sm text-white/72">Selecciona un día para ver todas las actividades en orden de hora.</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-xl">
            {events.length} este mes
          </span>
        </header>

        <section
          aria-label="Calendario mensual"
          className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/[0.09] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-[24px] backdrop-saturate-[165%] sm:p-6"
        >
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(110%_65%_at_8%_0%,rgba(255,255,255,0.28),transparent_58%),linear-gradient(155deg,rgba(255,255,255,0.10),rgba(255,255,255,0.015))]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/10" aria-hidden="true" />

          <div className="relative mb-5 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Mes anterior"
              className="flex h-10 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition hover:bg-white/18 active:scale-95"
            >
              ← <span className="hidden sm:inline">Anterior</span>
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{year}</p>
              <strong className="font-display text-xl font-semibold capitalize sm:text-2xl">{monthLabel.replace(String(year), "").trim()}</strong>
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Mes siguiente"
              className="flex h-10 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition hover:bg-white/18 active:scale-95"
            >
              <span className="hidden sm:inline">Siguiente</span> →
            </button>
          </div>

          <div className="relative grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.10em] text-white/60 sm:text-xs">
            {WEEK.map((label) => <div key={label} className="py-1">{label}</div>)}
          </div>

          <div className="relative mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: firstOffset }).map((_, index) => <div key={`blank-${index}`} />)}
            {Array.from({ length: dayCount }, (_, index) => index + 1).map((day) => {
              const key = `${month}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(key) ?? [];
              const selected = selectedDate === key;
              const isToday = today === key;
              const colors = [...new Set(dayEvents.map((event) => event.category.colorHex))].slice(0, 4);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseDay(key)}
                  aria-label={`${day} de ${monthLabel}, ${dayEvents.length} actividades`}
                  aria-pressed={selected}
                  className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-full border text-sm font-semibold transition duration-200 sm:text-base ${
                    selected
                      ? "border-white/70 bg-white/88 text-[#0B2B26] shadow-[0_7px_24px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.85)]"
                      : isToday
                        ? "border-white/55 bg-white/10 text-white backdrop-blur-sm"
                        : "border-transparent text-white/90 hover:border-white/20 hover:bg-white/10"
                  } ${justSelected === key ? "day-cell-selected" : ""}`}
                >
                  <span>{day}</span>
                  {colors.length ? (
                    <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5" aria-hidden="true">
                      {colors.map((color) => (
                        <span key={color} className="dot-pulse h-1.5 w-1.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color, color }} />
                      ))}
                    </span>
                  ) : <span className="mt-0.5 h-1.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="agenda-day-title" className="mt-5 space-y-3 text-white">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Actividades del día</p>
              <h2 id="agenda-day-title" className="font-display text-2xl font-semibold capitalize drop-shadow-sm">{selectedLabel}</h2>
            </div>
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xl">{selectedEvents.length}</span>
          </div>

          {selectedEvents.length ? selectedEvents.map((event, index) => (
            <Link
              key={event.id}
              href={`/eventos/${event.slug}`}
              className="stagger-item group relative block overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/[0.09] p-5 text-white shadow-[0_20px_55px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.30)] backdrop-blur-[22px] backdrop-saturate-[170%] transition hover:bg-white/[0.13] sm:p-6"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_5%_0%,rgba(255,255,255,0.24),transparent_58%),linear-gradient(150deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" aria-hidden="true" />
              <div className="relative flex gap-4">
                <div className="w-[4.8rem] shrink-0">
                  <p className="font-display text-xl font-semibold drop-shadow-sm">{formatEventTime(event.startsAt)}</p>
                  {event.endsAt ? <p className="mt-0.5 text-xs text-white/62">a {formatEventTime(event.endsAt)}</p> : null}
                </div>
                <div className="min-w-0 flex-1 border-l-[3px] pl-4" style={{ borderColor: event.category.colorHex }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold leading-tight drop-shadow-sm">{event.name}</h3>
                    {event.featured ? <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90">★ Destacado</span> : null}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-white/85">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: event.category.colorHex }} aria-hidden="true" />
                    {event.category.name}{event.ministryName ? ` · ${event.ministryName}` : ""}
                  </p>
                  {event.description ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/72">{event.description}</p> : null}
                  {event.location ? <p className="mt-2 text-sm text-white/78">⌖ {event.location}</p> : null}
                  {event.attendanceMode !== "none" ? (
                    <p className="mt-2 text-xs font-medium text-white/65">
                      {event.attendanceMode === "rsvp" ? "Confirma si asistirás" : "Requiere inscripción"}
                      {event.capacity ? ` · ${Math.max(event.capacity - event.registeredCount, 0)} cupos disponibles` : ""}
                    </p>
                  ) : null}
                  <span className="mt-3 inline-flex text-xs font-semibold text-white/85 transition group-hover:translate-x-0.5">Ver actividad →</span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/25 bg-white/[0.08] p-6 text-center text-sm text-white/75 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-[20px]">
              No hay actividades calendarizadas para este día.
            </div>
          )}
        </section>

        {announcements.length ? (
          <section className="mt-7 space-y-3 text-white" aria-labelledby="agenda-announcements">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Información para ti</p>
                <h2 id="agenda-announcements" className="font-display text-2xl font-semibold drop-shadow-sm">Anuncios vigentes</h2>
              </div>
              <Link href="/anuncios" className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl">Ver todos →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {announcements.map((announcement, index) => {
                const color = colorForCategory(announcement.category);
                return (
                  <article
                    key={announcement.id}
                    className="stagger-item relative overflow-hidden rounded-[1.6rem] border border-white/25 bg-white/[0.08] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.18)] backdrop-blur-[20px] backdrop-saturate-[165%]"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.10),rgba(255,255,255,0.01))]" aria-hidden="true" />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${color}22`, borderColor: `${color}70` }}>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                          {announcement.category}
                        </span>
                        {announcement.featured ? <span className="text-[11px] font-semibold text-white/85">★ Destacado</span> : null}
                      </div>
                      <h3 className="mt-2 font-display text-lg font-semibold leading-tight">{announcement.title}</h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-white/72">{announcement.description}</p>
                      {announcement.actionUrl && announcement.actionLabel ? (
                        <Link href={announcement.actionUrl} className="mt-3 inline-flex text-xs font-semibold text-white/90">{announcement.actionLabel} →</Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
