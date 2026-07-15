import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/es";
import { formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Eventos" };
export const revalidate = 300;

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, name, description, starts_at, ends_at, location, map_url, ministries(name)")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-semibold text-anil-800">{t.events.upcoming}</h1>
      {events?.length ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id}>
              <Card>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-anil-600 px-4 py-2 text-center text-white" aria-hidden>
                    <span className="block font-display text-2xl font-bold">
                      {new Date(event.starts_at).getDate()}
                    </span>
                    <span className="block text-xs uppercase">
                      {new Intl.DateTimeFormat("es-SV", { month: "short" }).format(new Date(event.starts_at))}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-semibold">{event.name}</h2>
                    <p className="text-sm text-tinta-suave">
                      {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
                      {event.ends_at ? `–${formatTime(event.ends_at)}` : null}
                    </p>
                    {event.location ? (
                      <p className="text-sm text-tinta-suave">
                        {t.events.location}: {event.map_url
                          ? <a className="text-anil-600 underline" href={event.map_url} target="_blank" rel="noopener noreferrer">{event.location}</a>
                          : event.location}
                      </p>
                    ) : null}
                    {(() => {
                      // Sin tipos generados de Supabase, la relación puede inferirse
                      // como arreglo aunque en tiempo de ejecución sea un solo objeto.
                      const ministry = Array.isArray(event.ministries)
                        ? event.ministries[0]
                        : event.ministries;
                      return ministry ? (
                        <Badge tone="balsamo" className="mt-2">{ministry.name}</Badge>
                      ) : null;
                    })()}
                    {event.description ? <p className="mt-2 text-sm">{event.description}</p> : null}
                    <a
                      className="mt-3 inline-block text-sm font-semibold text-anil-600"
                      href={icsHref(event.name, event.starts_at, event.ends_at, event.location)}
                      download={`${event.slug}.ics`}
                    >
                      {t.events.addToCalendar} ↓
                    </a>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t.events.empty} />
      )}
    </div>
  );
}

/** Genera un archivo .ics en un data URI: funciona sin backend y dentro de Capacitor. */
function icsHref(name: string, start: string, end: string | null, location: string | null) {
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Soy Templo//ES", "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    end ? `DTEND:${fmt(end)}` : "",
    `SUMMARY:${name}`,
    location ? `LOCATION:${location}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
