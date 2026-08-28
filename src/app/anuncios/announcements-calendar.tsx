"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { colorForCategory } from "@/lib/announcements/category-colors";

export type CalendarAnnouncement = {
  id: string;
  title: string;
  description: string;
  category: string;
  action_label: string | null;
  action_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  day: number;
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const categoryLabels: Record<string, string> = {
  general: "Información general",
  jovenes: "Jóvenes",
  ninos: "Niños",
  mujeres: "Mujeres",
  hombres: "Hombres",
  discipulado: "Discipulado",
  servicio: "Servicio comunitario",
  creativo: "Ministerio creativo",
  especiales: "Actividades especiales",
};

export function AnnouncementsCalendar({
  year,
  month,
  announcements,
  todayDay,
  isCurrentMonth,
  monthImageSrc,
}: {
  year: number;
  month: number;
  announcements: CalendarAnnouncement[];
  todayDay: number | null;
  isCurrentMonth: boolean;
  monthImageSrc: string;
}) {
  const router = useRouter();

  const byDay = useMemo(() => {
    const map = new Map<number, CalendarAnnouncement[]>();
    for (const announcement of announcements) {
      const list = map.get(announcement.day) ?? [];
      list.push(announcement);
      map.set(announcement.day, list);
    }
    return map;
  }, [announcements]);

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay();
  const defaultSelected = isCurrentMonth && todayDay ? todayDay : byDay.keys().next().value ?? null;
  const [selectedDay, setSelectedDay] = useState<number | null>(defaultSelected);
  const [justSelected, setJustSelected] = useState<number | null>(null);

  function goToMonth(deltaMonths: number) {
    const date = new Date(year, month - 1 + deltaMonths, 1);
    router.push(`/anuncios?y=${date.getFullYear()}&m=${date.getMonth() + 1}`);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    setJustSelected(day);
    window.setTimeout(() => setJustSelected(null), 300);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const selectedAnnouncements = selectedDay ? byDay.get(selectedDay) ?? [] : [];

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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,16,17,0.12)_0%,rgba(2,16,17,0.04)_42%,rgba(2,16,17,0.30)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/20 to-transparent" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 pb-28 pt-7 md:px-6 md:pb-14 md:pt-9">
        <div className="mb-4 flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Soy Templo</p>
            <h1 className="font-display text-3xl font-semibold drop-shadow-sm">Anuncios</h1>
          </div>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-xl">
            {announcements.length} este mes
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-white/[0.09] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-[24px] backdrop-saturate-[165%] sm:p-6">
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(110%_65%_at_8%_0%,rgba(255,255,255,0.28),transparent_58%),linear-gradient(155deg,rgba(255,255,255,0.10),rgba(255,255,255,0.015))]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-[1px] rounded-[calc(2rem-1px)] border border-white/10" aria-hidden="true" />

          <div className="relative mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{year}</p>
              <h2 className="font-display text-3xl font-semibold drop-shadow-sm">{MONTH_NAMES[month - 1]}</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label="Mes anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg text-white shadow-sm backdrop-blur-xl transition hover:bg-white/18 active:scale-95"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Mes siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg text-white shadow-sm backdrop-blur-xl transition hover:bg-white/18 active:scale-95"
              >
                →
              </button>
            </div>
          </div>

          <div className="relative grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 sm:text-xs">
            {WEEKDAYS.map((weekday) => <div key={weekday} className="py-1">{weekday}</div>)}
          </div>

          <div className="relative mt-2 grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;
              const dayItems = byDay.get(day) ?? [];
              const dayColors = Array.from(new Set(dayItems.map((announcement) => colorForCategory(announcement.category)))).slice(0, 3);
              const hasItems = dayItems.length > 0;
              const isToday = isCurrentMonth && day === todayDay;
              const isSelected = day === selectedDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-label={`${day} de ${MONTH_NAMES[month - 1]}${hasItems ? `, ${dayItems.length} actividades` : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-full border text-sm font-semibold transition duration-200 sm:text-base",
                    isSelected
                      ? "border-white/70 bg-white/88 text-[#0B2B26] shadow-[0_7px_24px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.85)]"
                      : isToday
                        ? "border-white/55 bg-white/10 text-white backdrop-blur-sm"
                        : "border-transparent text-white/90 hover:border-white/20 hover:bg-white/10",
                    justSelected === day && "day-cell-selected"
                  )}
                >
                  <span>{day}</span>
                  {hasItems ? (
                    <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5" aria-hidden="true">
                      {dayColors.map((color) => (
                        <span
                          key={color}
                          className="dot-pulse h-1.5 w-1.5 rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: color, color }}
                        />
                      ))}
                    </span>
                  ) : <span className="mt-0.5 h-1.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div key={selectedDay ?? "none"} className="mt-5 space-y-3 text-white">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Actividades del día</p>
              <h2 className="font-display text-2xl font-semibold drop-shadow-sm">
                {selectedDay ? `${selectedDay} de ${MONTH_NAMES[month - 1]}` : "Selecciona un día"}
              </h2>
            </div>
            {selectedDay ? (
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xl">
                {selectedAnnouncements.length}
              </span>
            ) : null}
          </div>

          {selectedAnnouncements.length ? (
            selectedAnnouncements.map((announcement, index) => {
              const color = colorForCategory(announcement.category);
              return (
                <article
                  key={announcement.id}
                  className="stagger-item relative overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/[0.09] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.30)] backdrop-blur-[22px] backdrop-saturate-[170%] sm:p-6"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_5%_0%,rgba(255,255,255,0.24),transparent_58%),linear-gradient(150deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" aria-hidden="true" />
                  <div className="relative">
                    {announcement.image_url ? (
                      <div className="mb-4 overflow-hidden rounded-2xl border border-white/20 bg-black/10">
                        <img src={announcement.image_url} alt="" className="max-h-64 w-full object-cover" />
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md"
                        style={{ backgroundColor: `${color}24`, borderColor: `${color}80`, color: "white" }}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                        {categoryLabels[announcement.category] ?? announcement.category}
                      </span>
                      {announcement.is_featured ? (
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90">★ Destacado</span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 font-display text-2xl font-semibold leading-tight drop-shadow-sm">{announcement.title}</h3>
                    <p className="mt-2 max-w-2xl leading-relaxed text-white/82">{announcement.description}</p>
                    {announcement.action_url && announcement.action_label ? (
                      <Link
                        href={announcement.action_url}
                        className="mt-4 inline-flex min-h-10 items-center rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-xl transition hover:bg-white/20"
                      >
                        {announcement.action_label} →
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/25 bg-white/[0.08] p-6 text-center text-sm text-white/75 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-[20px]">
              {selectedDay ? "No hay actividades calendarizadas para este día." : "Elige un día para ver sus actividades."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
