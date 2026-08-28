import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { monthRange, todayInElSalvador } from "@/lib/events/calendar";
import { EventsCalendar, type CalendarEvent } from "./events-calendar";

export const metadata: Metadata = { title: "Eventos y agenda" };
export const dynamic = "force-dynamic";

function one<T>(value: T | T[] | null | undefined): T | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ month?: string; date?: string }> }) {
  const params = await searchParams;
  const today = todayInElSalvador();
  const requestedMonth = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : today.slice(0, 7);
  const selectedDate = params.date && params.date.startsWith(`${requestedMonth}-`) ? params.date : (today.startsWith(requestedMonth) ? today : `${requestedMonth}-01`);
  const range = monthRange(requestedMonth);
  const supabase = await createClient();

  const { data: rows } = await supabase.from("events")
    .select("id,slug,name,description,starts_at,ends_at,location,map_url,image_url,capacity,registered_count,attendance_mode,is_featured,category:event_categories(slug,name,color_hex),ministry:ministries(name)")
    .eq("status", "published").is("deleted_at", null).gte("starts_at", range.start).lt("starts_at", range.end).order("starts_at", { ascending: true });

  const events: CalendarEvent[] = (rows ?? []).map((row) => {
    const category = one(row.category as { slug: string; name: string; color_hex: string } | { slug: string; name: string; color_hex: string }[] | null);
    const ministry = one(row.ministry as { name: string } | { name: string }[] | null);
    return {
      id: row.id, slug: row.slug, name: row.name, description: row.description, startsAt: row.starts_at, endsAt: row.ends_at,
      location: row.location, imageUrl: row.image_url, capacity: row.capacity, registeredCount: row.registered_count ?? 0,
      attendanceMode: row.attendance_mode ?? "none", featured: row.is_featured ?? false,
      category: category ? { slug: category.slug, name: category.name, colorHex: category.color_hex } : { slug: "general", name: "General", colorHex: "#5B5FEF" },
      ministryName: ministry?.name ?? null,
    };
  });

  return <EventsCalendar month={requestedMonth} initialSelectedDate={selectedDate} today={today} events={events} monthImageSrc={`/anuncios-backgrounds/month-${requestedMonth.slice(5, 7)}.jpg`} />;
}
