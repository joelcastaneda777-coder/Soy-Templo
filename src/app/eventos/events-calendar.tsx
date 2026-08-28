"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dateKeyFromIso, formatEventTime, shiftMonth } from "@/lib/events/calendar";

export type CalendarEvent = {
  id: string; slug: string; name: string; description: string | null; startsAt: string; endsAt: string | null;
  location: string | null; imageUrl: string | null; capacity: number | null; registeredCount: number; attendanceMode: string;
  featured: boolean; category: { slug: string; name: string; colorHex: string }; ministryName: string | null;
};

export type AgendaAnnouncement = {
  id: string; title: string; description: string; category: string; imageUrl: string | null;
  actionLabel: string | null; actionUrl: string | null; featured: boolean;
};

const week = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function EventsCalendar({ month, initialSelectedDate, today, events, announcements }: {
  month: string; initialSelectedDate: string; today: string; events: CalendarEvent[]; announcements: AgendaAnnouncement[];
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const firstOffset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("es-SV", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay);

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

  function chooseDay(key: string) {
    setSelectedDate(key);
    router.replace(`/eventos?month=${month}&date=${key}`, { scroll: false });
  }

  function go(delta: number) {
    const target = shiftMonth(month, delta);
    router.push(`/eventos?month=${target}`);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tinta-suave">Agenda Soy Templo</p>
        <h1 className="mt-1 font-display text-3xl font-semibold capitalize text-anil-800">{monthLabel}</h1>
        <p className="mt-1 text-sm text-tinta-suave">Selecciona un día para ver todas las actividades en orden de hora.</p>
      </header>

      <section aria-label="Calendario mensual" className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => go(-1)} className="rounded-xl border border-manta px-3 py-2 text-sm font-semibold">← Anterior</button>
          <strong className="capitalize">{monthLabel}</strong>
          <button type="button" onClick={() => go(1)} className="rounded-xl border border-manta px-3 py-2 text-sm font-semibold">Siguiente →</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-tinta-suave sm:text-xs">
          {week.map((label) => <div key={label} className="py-2">{label}</div>)}
          {Array.from({ length: firstOffset }).map((_, i) => <div key={`blank-${i}`} />)}
          {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
            const key = `${month}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate.get(key) ?? [];
            const selected = selectedDate === key;
            const isToday = today === key;
            const colors = [...new Set(dayEvents.map((event) => event.category.colorHex))].slice(0, 4);
            return (
              <button key={key} type="button" onClick={() => chooseDay(key)} aria-label={`${day} de ${monthLabel}, ${dayEvents.length} actividades`}
                className={`min-h-12 rounded-2xl border p-1 transition sm:min-h-16 ${selected ? "border-anil-600 bg-anil-50" : "border-transparent hover:border-manta"}`}>
                <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-anil-700 text-white" : ""}`}>{day}</span>
                <span className="mt-1 flex justify-center gap-1" aria-hidden>
                  {colors.map((color) => <span key={color} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />)}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="agenda-day-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-tinta-suave">Actividades del día</p>
            <h2 id="agenda-day-title" className="font-display text-2xl font-semibold">{new Intl.DateTimeFormat("es-SV", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${selectedDate}T12:00:00Z`))}</h2>
          </div>
          <span className="text-sm font-semibold text-tinta-suave">{selectedEvents.length}</span>
        </div>
        {selectedEvents.length ? selectedEvents.map((event) => (
          <Link key={event.id} href={`/eventos/${event.slug}`} className="block rounded-[var(--radius-card)] border border-manta bg-white p-4 transition hover:-translate-y-0.5 dark:bg-manta">
            <div className="flex gap-4">
              <div className="w-20 shrink-0">
                <p className="font-display text-lg font-semibold">{formatEventTime(event.startsAt)}</p>
                {event.endsAt ? <p className="text-xs text-tinta-suave">a {formatEventTime(event.endsAt)}</p> : null}
              </div>
              <div className="min-w-0 flex-1 border-l-4 pl-4" style={{ borderColor: event.category.colorHex }}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{event.name}</h3>
                  {event.featured ? <span className="rounded-full bg-anil-50 px-2 py-0.5 text-xs font-semibold text-anil-700">Destacado</span> : null}
                </div>
                <p className="mt-1 text-xs font-semibold" style={{ color: event.category.colorHex }}>{event.category.name}{event.ministryName ? ` · ${event.ministryName}` : ""}</p>
                {event.location ? <p className="mt-1 text-sm text-tinta-suave">📍 {event.location}</p> : null}
                {event.attendanceMode !== "none" ? <p className="mt-1 text-xs text-tinta-suave">{event.attendanceMode === "rsvp" ? "Confirma si asistirás" : "Requiere inscripción"}{event.capacity ? ` · ${Math.max(event.capacity - event.registeredCount, 0)} cupos disponibles` : ""}</p> : null}
              </div>
            </div>
          </Link>
        )) : <div className="rounded-[var(--radius-card)] border border-dashed border-manta p-6 text-center text-sm text-tinta-suave">No hay actividades calendarizadas para este día.</div>}
      </section>

      {announcements.length ? (
        <section className="space-y-3" aria-labelledby="agenda-announcements">
          <div className="flex items-center justify-between"><h2 id="agenda-announcements" className="font-display text-2xl font-semibold">Anuncios vigentes</h2><Link href="/anuncios" className="text-sm font-semibold text-anil-600">Ver todos →</Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
                <div className="flex items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-anil-600">{announcement.category}</span>{announcement.featured ? <span className="text-xs">★ Destacado</span> : null}</div>
                <h3 className="mt-1 font-display text-lg font-semibold">{announcement.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-tinta-suave">{announcement.description}</p>
                {announcement.actionUrl && announcement.actionLabel ? <Link href={announcement.actionUrl} className="mt-3 inline-block text-sm font-semibold text-anil-600">{announcement.actionLabel} →</Link> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
