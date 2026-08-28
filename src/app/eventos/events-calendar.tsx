"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dateKeyFromIso, formatEventTime, shiftMonth } from "@/lib/events/calendar";

export type CalendarEvent = {
  id: string; slug: string; name: string; description: string | null; startsAt: string; endsAt: string | null;
  location: string | null; imageUrl: string | null; capacity: number | null; registeredCount: number; attendanceMode: string;
  featured: boolean; category: { slug: string; name: string; colorHex: string }; ministryName: string | null;
};

const WEEK = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function EventsCalendar({ month, initialSelectedDate, today, events, monthImageSrc }: { month: string; initialSelectedDate: string; today: string; events: CalendarEvent[]; monthImageSrc: string }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText ?? 1970); const monthNumber = Number(monthText ?? 1);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const firstOffset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthName = new Intl.DateTimeFormat("es-SV", { month: "long", timeZone: "UTC" }).format(firstDay);
  const monthLabel = `${monthName} de ${year}`;

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) { const key = dateKeyFromIso(event.startsAt); const list = map.get(key) ?? []; list.push(event); map.set(key, list); }
    return map;
  }, [events]);
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedLabel = new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${selectedDate}T12:00:00Z`));

  function chooseDay(key: string) { setSelectedDate(key); setJustSelected(key); router.replace(`/eventos?month=${month}&date=${key}`, { scroll: false }); window.setTimeout(() => setJustSelected(null), 300); }
  function go(delta: number) { router.push(`/eventos?month=${shiftMonth(month, delta)}`); }

  return <section className="relative left-1/2 -mt-4 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden md:-mt-4">
    <Image key={monthImageSrc} src={monthImageSrc} alt="" fill sizes="100vw" className="animate-month-fade scale-[1.01] object-cover object-center" priority unoptimized />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,16,17,0.18)_0%,rgba(2,16,17,0.05)_38%,rgba(2,16,17,0.42)_100%)]" aria-hidden="true" />
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />

    <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 pb-28 pt-7 md:px-6 md:pb-14 md:pt-9">
      <header className="mb-4 flex items-end justify-between gap-4 text-white">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Agenda Soy Templo</p><h1 className="mt-1 font-display text-3xl font-semibold capitalize drop-shadow-sm">{monthLabel}</h1><p className="mt-1 max-w-lg text-sm text-white/72">Selecciona un día para ver todas las actividades en orden de hora.</p></div>
        <span className="shrink-0 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-xl">{events.length} este mes</span>
      </header>

      <section aria-label="Calendario mensual" className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/[0.08] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-[20px] backdrop-saturate-[165%] sm:p-6">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(110%_65%_at_8%_0%,rgba(255,255,255,0.25),transparent_58%),linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" aria-hidden="true" />
        <div className="relative mb-5 flex items-center justify-between gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Mes anterior" className="flex h-10 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold shadow-sm backdrop-blur-xl transition hover:bg-white/18">← <span className="hidden sm:inline">Anterior</span></button>
          <div className="text-center"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{year}</p><strong className="font-display text-xl font-semibold capitalize sm:text-2xl">{monthName}</strong></div>
          <button type="button" onClick={() => go(1)} aria-label="Mes siguiente" className="flex h-10 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold shadow-sm backdrop-blur-xl transition hover:bg-white/18"><span className="hidden sm:inline">Siguiente</span> →</button>
        </div>
        <div className="relative grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.10em] text-white/60 sm:text-xs">{WEEK.map((label) => <div key={label} className="py-1">{label}</div>)}</div>
        <div className="relative mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: firstOffset }).map((_, index) => <div key={`blank-${index}`} />)}
          {Array.from({ length: dayCount }, (_, index) => index + 1).map((day) => {
            const key = `${month}-${String(day).padStart(2, "0")}`; const dayEvents = eventsByDate.get(key) ?? []; const selected = selectedDate === key; const isToday = today === key;
            const colors = [...new Set(dayEvents.map((event) => event.category.colorHex))].slice(0, 4);
            return <button key={key} type="button" onClick={() => chooseDay(key)} aria-label={`${day} de ${monthLabel}, ${dayEvents.length} actividades`} aria-pressed={selected}
              className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-full border text-sm font-semibold transition duration-200 sm:text-base ${selected ? "border-white/70 bg-white/88 text-[#0B2B26] shadow-[0_7px_24px_rgba(0,0,0,0.16)]" : isToday ? "border-white/55 bg-white/10 text-white backdrop-blur-sm" : "border-transparent text-white/90 hover:border-white/20 hover:bg-white/10"} ${justSelected === key ? "day-cell-selected" : ""}`}>
              <span>{day}</span>{colors.length ? <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5" aria-hidden="true">{colors.map((color) => <span key={color} className="dot-pulse h-1.5 w-1.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color, color }} />)}</span> : <span className="mt-0.5 h-1.5" />}
            </button>;
          })}
        </div>
      </section>

      <section aria-labelledby="agenda-day-title" className="mt-5 space-y-3 text-white">
        <div className="flex items-center justify-between gap-3 px-1"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Actividades del día</p><h2 id="agenda-day-title" className="font-display text-2xl font-semibold capitalize drop-shadow-sm">{selectedLabel}</h2></div><span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xl">{selectedEvents.length}</span></div>
        {selectedEvents.length ? selectedEvents.map((event, index) => <Link key={event.id} href={`/eventos/${event.slug}`} className="stagger-item group relative block overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/[0.09] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.20)] backdrop-blur-[20px] transition hover:bg-white/[0.13] sm:p-6" style={{ animationDelay: `${index * 55}ms` }}>
          <div className="relative flex gap-4"><div className="w-[4.8rem] shrink-0"><p className="font-display text-xl font-semibold">{formatEventTime(event.startsAt)}</p>{event.endsAt ? <p className="mt-0.5 text-xs text-white/62">a {formatEventTime(event.endsAt)}</p> : null}</div>
          <div className="min-w-0 flex-1 border-l-[3px] pl-4" style={{ borderColor: event.category.colorHex }}><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-xl font-semibold leading-tight">{event.name}</h3>{event.featured ? <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold">★ Destacado</span> : null}</div><p className="mt-1.5 text-xs font-semibold text-white/85"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: event.category.colorHex }} />{event.category.name}{event.ministryName ? ` · ${event.ministryName}` : ""}</p>{event.description ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/72">{event.description}</p> : null}{event.location ? <p className="mt-2 text-sm text-white/78">⌖ {event.location}</p> : null}{event.attendanceMode !== "none" ? <p className="mt-2 text-xs font-medium text-white/65">{event.attendanceMode === "rsvp" ? "Confirma si asistirás" : "Requiere inscripción"}{event.capacity ? ` · ${Math.max(event.capacity - event.registeredCount, 0)} cupos disponibles` : ""}</p> : null}<span className="mt-3 inline-flex text-xs font-semibold text-white/85">Ver actividad →</span></div></div>
        </Link>) : <div className="rounded-[1.8rem] border border-white/25 bg-white/[0.08] p-6 text-center text-sm text-white/75 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-[18px]">No hay actividades calendarizadas para este día.</div>}
      </section>
    </div>
  </section>;
}
