import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { AnnouncementsCalendar, type CalendarAnnouncement } from "./announcements-calendar";

export const metadata: Metadata = { title: "Anuncios" };
export const dynamic = "force-dynamic";

const TZ = "America/El_Salvador";

function todayInElSalvador(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Día del mes (1-31) de una fecha ISO, en hora de El Salvador. */
function dayOfMonthInElSalvador(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, day: "2-digit" }).formatToParts(new Date(iso));
  return Number(parts.find((p) => p.type === "day")?.value);
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const today = todayInElSalvador();

  const year = Number(y) || today.year;
  const month = Number(m) || today.month; // 1-12
  const isCurrentMonth = year === today.year && month === today.month;

  // Rango del mes en UTC aproximado (suficiente para filtrar; el día exacto
  // de cada anuncio se recalcula abajo en hora de El Salvador).
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  // Colchón de un día a cada lado para no perder anuncios cerca del cambio de mes por zona horaria.
  monthStart.setUTCDate(monthStart.getUTCDate() - 1);
  monthEnd.setUTCDate(monthEnd.getUTCDate() + 1);

  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, description, category, action_label, action_url, image_url, is_featured, publish_at")
    .eq("status", "published")
    .eq("display_on_agenda", true)
    .gte("publish_at", monthStart.toISOString())
    .lt("publish_at", monthEnd.toISOString())
    .order("priority", { ascending: false })
    .order("publish_at", { ascending: true });

  const announcements: CalendarAnnouncement[] = (data ?? [])
    .map((a) => ({ ...a, day: dayOfMonthInElSalvador(a.publish_at) }))
    // vuelve a filtrar por si el colchón de zona horaria trajo un día del mes vecino
    .filter((a) => {
      const d = new Date(a.publish_at);
      const local = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(d);
      return local === `${year}-${String(month).padStart(2, "0")}`;
    });

  return (
    <div className="space-y-5">
      <PageHero title={t.nav.announcements} />
      <AnnouncementsCalendar
        year={year}
        month={month}
        announcements={announcements}
        todayDay={isCurrentMonth ? today.day : null}
        isCurrentMonth={isCurrentMonth}
        monthImageSrc={`/anuncios-backgrounds/month-${String(month).padStart(2, "0")}.jpg`}
      />
    </div>
  );
}
