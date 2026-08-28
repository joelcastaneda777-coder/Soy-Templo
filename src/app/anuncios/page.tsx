import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dayOfMonthInElSalvador(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, day: "2-digit" }).formatToParts(new Date(iso));
  return Number(parts.find((part) => part.type === "day")?.value);
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const today = todayInElSalvador();
  const requestedYear = Number(y);
  const requestedMonth = Number(m);
  const year = Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100 ? requestedYear : today.year;
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : today.month;
  const isCurrentMonth = year === today.year && month === today.month;

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));
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
    .map((announcement) => ({ ...announcement, day: dayOfMonthInElSalvador(announcement.publish_at) }))
    .filter((announcement) => {
      const localMonth = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
      }).format(new Date(announcement.publish_at));
      return localMonth === `${year}-${String(month).padStart(2, "0")}`;
    });

  return (
    <AnnouncementsCalendar
      year={year}
      month={month}
      announcements={announcements}
      todayDay={isCurrentMonth ? today.day : null}
      isCurrentMonth={isCurrentMonth}
      monthImageSrc={`/anuncios-backgrounds/month-${String(month).padStart(2, "0")}.jpg`}
    />
  );
}
