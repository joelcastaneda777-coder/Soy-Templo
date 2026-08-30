import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { WeeklyAnnouncementsCarousel, type WeeklyAnnouncement } from "@/components/home/weekly-announcements-carousel";
import { t } from "@/lib/i18n/es";
import { greetingByHour, formatDate, formatTime } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [devotionalRes, eventRes, announcementsRes, radioRes] = await Promise.all([
    supabase
      .from("devotionals")
      .select("slug, title, bible_reading, key_verse")
      .eq("status", "published")
      .lte("publish_at", now)
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("slug, name, starts_at, location")
      .eq("status", "published")
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, description, category, action_label, action_url, image_url, is_featured")
      .eq("status", "published")
      .lte("publish_at", now)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("is_featured", { ascending: false })
      .order("priority", { ascending: false })
      .order("publish_at", { ascending: false })
      .limit(8),
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
  ]);

  const devotional = devotionalRes.data;
  const event = eventRes.data;
  const announcements: WeeklyAnnouncement[] = (announcementsRes.data ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    description: announcement.description,
    category: announcement.category,
    actionLabel: announcement.action_label,
    actionUrl: announcement.action_url,
    imageUrl: announcement.image_url,
    featured: announcement.is_featured,
  }));
  const radio = (radioRes.data?.value as { name?: string; stream_url?: string | null } | null) ?? {};
  const radioName = radio.name || t.radio.title;
  const isRadioLive = !!radio.stream_url;

  return (
    <div className="-mx-4 -mt-4 md:-mx-6">
      <section className="space-y-5 overflow-hidden rounded-b-[2rem] bg-[radial-gradient(circle_at_18%_15%,rgba(82,143,143,0.13),transparent_35%),radial-gradient(circle_at_88%_78%,rgba(6,133,98,0.10),transparent_32%),linear-gradient(155deg,#F1FAF4_0%,#E7F5EC_50%,#DCEFE6_100%)] px-4 pb-6 pt-5 text-[#063547] md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/brand/logo.png" alt="" width={40} height={38} className="h-9 w-auto" priority />
            <span className="font-display text-lg font-semibold text-[#063547]">{t.app.name}</span>
          </div>
          <Link
            href="/radio"
            aria-label={`Abrir ${radioName}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#063547]/15 bg-[#063547] px-3.5 py-2 font-semibold text-white shadow-[0_10px_28px_rgba(6,53,71,0.16)] transition-transform active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-8" />
                <path d="M9.5 20h5" />
                <circle cx="12" cy="9" r="1.6" />
                <path d="M8.5 5.5a5 5 0 0 0 0 7" />
                <path d="M15.5 5.5a5 5 0 0 1 0 7" />
                <path d="M6 3a8.5 8.5 0 0 0 0 12" />
                <path d="M18 3a8.5 8.5 0 0 1 0 12" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-xs text-white/65">Radio</span>
              <span className="block text-sm">{isRadioLive ? "En vivo" : "Soy Templo"}</span>
            </span>
            {isRadioLive ? <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden="true" /> : null}
          </Link>
        </div>

        <p className="text-sm font-medium text-[#063547]/70">{greetingByHour()}</p>

        {devotional ? (
          <Link href={`/devocionales/${devotional.slug}`} className="block">
            <div className="rounded-[var(--radius-card)] border border-[#063547]/10 bg-white/34 p-6 text-[#063547] shadow-[inset_0_1px_0_rgba(255,255,255,.65),0_12px_34px_rgba(6,53,71,.08)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0A5A5E]">{t.home.todayDevotional}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">{devotional.title}</h2>
              <p className="mt-3 font-display text-lg italic leading-relaxed text-[#063547]/82">{devotional.key_verse}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0A5A5E]">{t.home.readMore} →</p>
            </div>
          </Link>
        ) : null}

        <div aria-label={t.home.quickActions} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink href="/donar" label={t.nav.donate} accent />
          <QuickLink href="/oracion" label={t.nav.prayer} />
          <QuickLink href="/planes" label={t.nav.plans} />
          <QuickLink href="/radio" label={radioName} />
        </div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_18%,rgba(24,122,122,.20),transparent_27%),radial-gradient(circle_at_90%_72%,rgba(6,133,98,.13),transparent_30%),linear-gradient(165deg,#063547_0%,#074B53_44%,#03333A_72%,#021F25_100%)] px-4 pb-28 pt-6 text-white md:px-6 md:pb-12">
        <div className="mx-auto max-w-5xl space-y-7">
          {event ? (
            <div className="rounded-[var(--radius-card)] border border-white/12 bg-white/[0.045] p-5 shadow-[0_18px_45px_rgba(0,0,0,.12)] backdrop-blur-xl">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/85">{t.home.nextEvent}</span>
              <h2 className="mt-3 font-display text-xl font-semibold text-white">{event.name}</h2>
              <p className="mt-1 text-sm text-white/62">{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</p>
              {event.location ? <p className="text-sm text-white/62">{event.location}</p> : null}
              <Link href="/eventos" className="mt-3 inline-block text-sm font-semibold text-emerald-200">{t.events.upcoming} →</Link>
            </div>
          ) : null}

          <WeeklyAnnouncementsCarousel items={announcements} variant="dark" />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={accent
        ? "flex min-h-16 items-center justify-center rounded-2xl bg-[#063547] font-semibold text-white shadow-[0_10px_28px_rgba(6,53,71,.14)] hover:brightness-110"
        : "flex min-h-16 items-center justify-center rounded-2xl border border-[#063547]/10 bg-[#BEDCCB]/55 font-semibold text-[#063547] shadow-[inset_0_1px_0_rgba(255,255,255,.65)] backdrop-blur-xl hover:bg-[#BEDCCB]/70"}
    >
      {label}
    </Link>
  );
}
