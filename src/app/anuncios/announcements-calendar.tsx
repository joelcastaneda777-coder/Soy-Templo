"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type CalendarAnnouncement = {
  id: string;
  title: string;
  description: string;
  category: string;
  action_label: string | null;
  action_url: string | null;
  image_url: string | null;
  is_featured: boolean;
  day: number; // día del mes (1-31), ya calculado en hora de El Salvador
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const categoryLabels: Record<string, string> = {
  general: "Información general", jovenes: "Jóvenes", ninos: "Niños",
  mujeres: "Mujeres", hombres: "Hombres", discipulado: "Discipulado",
  servicio: "Servicio comunitario", creativo: "Ministerio creativo", especiales: "Actividades especiales",
};

export function AnnouncementsCalendar({
  year,
  month, // 1-12
  announcements,
  todayDay,
  isCurrentMonth,
}: {
  year: number;
  month: number;
  announcements: CalendarAnnouncement[];
  todayDay: number | null;
  isCurrentMonth: boolean;
}) {
  const router = useRouter();

  const byDay = new Map<number, CalendarAnnouncement[]>();
  for (const a of announcements) {
    const list = byDay.get(a.day) ?? [];
    list.push(a);
    byDay.set(a.day, list);
  }

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDayOfMonth.getDay(); // 0 = domingo

  const defaultSelected = isCurrentMonth && todayDay ? todayDay : byDay.keys().next().value ?? null;
  const [selectedDay, setSelectedDay] = useState<number | null>(defaultSelected);
  const [justSelected, setJustSelected] = useState<number | null>(null);

  function goToMonth(deltaMonths: number) {
    const d = new Date(year, month - 1 + deltaMonths, 1);
    router.push(`/anuncios?y=${d.getFullYear()}&m=${d.getMonth() + 1}`);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    setJustSelected(day);
    window.setTimeout(() => setJustSelected(null), 300);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedAnnouncements = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="glass-surface rounded-[2rem] p-5" data-variant="strong">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">{MONTH_NAMES[month - 1]}</h2>
            <p className="text-sm text-anil-50/60">{year}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Mes anterior"
              className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-anil-50"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Mes siguiente"
              className="glass-chip flex h-9 w-9 items-center justify-center rounded-full text-anil-50"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-anil-50/50">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const hasItems = byDay.has(day);
            const isToday = isCurrentMonth && day === todayDay;
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                aria-label={`${day} de ${MONTH_NAMES[month - 1]}${hasItems ? ", con anuncios" : ""}`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-anil-50 text-anil-900"
                    : isToday
                      ? "border border-cirio-500/70 text-anil-50"
                      : "text-anil-50/80 hover:bg-white/10",
                  justSelected === day && "day-cell-selected"
                )}
              >
                {day}
                {hasItems ? (
                  <span
                    className={cn(
                      "dot-pulse mt-0.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "text-anil-900" : "text-cirio-500"
                    )}
                    style={{ backgroundColor: "currentColor" }}
                    aria-hidden
                  />
                ) : (
                  <span className="mt-0.5 h-1.5 w-1.5" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div key={selectedDay ?? "none"} className="space-y-3">
        {selectedAnnouncements.length ? (
          selectedAnnouncements.map((a, i) => (
            <Card key={a.id} className="stagger-item" style={{ animationDelay: `${i * 50}ms` }}>
              {a.image_url ? (
                <img src={a.image_url} alt="" className="mb-4 max-h-56 w-full rounded-2xl object-cover" />
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="anil">{categoryLabels[a.category] ?? a.category}</Badge>
                {a.is_featured ? <span className="text-xs font-semibold text-cirio-600">★ Destacado</span> : null}
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold">{a.title}</h3>
              <p className="mt-1 leading-relaxed text-tinta-suave">{a.description}</p>
              {a.action_url && a.action_label ? (
                <Link href={a.action_url} className="mt-3 inline-block font-semibold text-anil-600">
                  {a.action_label} →
                </Link>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            title={selectedDay ? "Sin anuncios ese día." : "Elige un día con punto para ver el anuncio."}
          />
        )}
      </div>
    </div>
  );
}
