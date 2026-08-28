import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsWall, type WallAnnouncement } from "./announcements-wall";

export const metadata: Metadata = { title: "Anuncios" };
export const dynamic = "force-dynamic";

const TZ = "America/El_Salvador";

function todayInElSalvador(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month") };
}

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ y?: string; m?: string }> }) {
  const { y, m } = await searchParams;
  const today = todayInElSalvador();
  const requestedYear = Number(y);
  const requestedMonth = Number(m);
  const year = Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100 ? requestedYear : today.year;
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12 ? requestedMonth : today.month;

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 6, 0, 0)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 1, 6, 0, 0)).toISOString();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id,title,description,category,announcement_kind,image_url,action_label,action_url,is_featured,effective_at,effective_until,publish_at,status,deleted_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .lt("effective_at", monthEnd)
    .or(`effective_until.is.null,effective_until.gte.${monthStart}`)
    .order("is_featured", { ascending: false })
    .order("effective_at", { ascending: false });

  const announcements: WallAnnouncement[] = (data ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    category: announcement.category,
    kind: announcement.announcement_kind ?? "aviso",
    imageUrl: announcement.image_url,
    actionLabel: announcement.action_label,
    actionUrl: announcement.action_url,
    featured: announcement.is_featured ?? false,
    effectiveAt: announcement.effective_at,
    effectiveUntil: announcement.effective_until,
  }));

  return <AnnouncementsWall year={year} month={month} announcements={announcements} />;
}
