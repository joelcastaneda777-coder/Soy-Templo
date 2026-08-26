import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n/es";
import { greetingByHour, formatDate, formatTime } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [devotionalRes, eventRes, announcementRes, radioRes] = await Promise.all([
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
      .select("id, title, description, action_label, action_url")
      .eq("status", "published")
      .lte("publish_at", now)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order("priority", { ascending: false })
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
  ]);

  const devotional = devotionalRes.data;
  const event = eventRes.data;
  const announcement = announcementRes.data;
  const radio = (radioRes.data?.value as { name?: string; stream_url?: string | null } | null) ?? {};
  const radioName = radio.name || t.radio.title;
  const isRadioLive = !!radio.stream_url;

  return (
    <div className="space-y-6">
      <section className="hero-mesh -mx-4 -mt-4 space-y-5 rounded-b-[2rem] px-4 pb-6 pt-5 md:-mx-6 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/brand/logo-light.png" alt="" width={40} height={38} className="h-9 w-auto" priority />
            <span className="font-display text-lg font-semibold text-anil-50">{t.app.name}</span>
          </div>
          <Link
            href="/radio"
            aria-label={`Abrir ${radioName}`}
            className="glass-chip inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 font-semibold text-anil-50 transition-transform active:scale-95"
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
              <span className="block text-xs opacity-70">Radio</span>
              <span className="block text-sm">{isRadioLive ? "En vivo" : "Soy Templo"}</span>
            </span>
            {isRadioLive ? <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden="true" /> : null}
          </Link>
        </div>

        <div>
          <p className="text-sm font-medium text-anil-50/70">{greetingByHour()}</p>
        </div>

        {devotional ? (
          <Link href={`/devocionales/${devotional.slug}`} className="block">
            <div className="glass rounded-[var(--radius-card)] p-6 text-anil-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-cirio-100">{t.home.todayDevotional}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">{devotional.title}</h2>
              <p className="mt-3 font-display text-lg italic leading-relaxed opacity-95">{devotional.key_verse}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cirio-100">{t.home.readMore} →</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        {event ? (
          <Card>
            <Badge tone="balsamo">{t.home.nextEvent}</Badge>
            <h2 className="mt-2 font-display text-xl font-semibold">{event.name}</h2>
            <p className="mt-1 text-sm text-tinta-suave">{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</p>
            {event.location ? <p className="text-sm text-tinta-suave">{event.location}</p> : null}
            <Link href="/eventos" className="mt-3 inline-block text-sm font-semibold text-anil-600">{t.events.upcoming} →</Link>
          </Card>
        ) : null}

        {announcement ? (
          <Card>
            <Badge tone="cirio">{t.home.featuredAnnouncement}</Badge>
            <h2 className="mt-2 font-display text-xl font-semibold">{announcement.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-tinta-suave">{announcement.description}</p>
            <Link href="/anuncios" className="mt-3 inline-block text-sm font-semibold text-anil-600">{t.nav.announcements} →</Link>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function QuickLink({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={accent
        ? "flex min-h-16 items-center justify-center rounded-2xl bg-cirio-500 font-semibold text-anil-900 shadow-sm hover:brightness-95"
        : "glass-chip flex min-h-16 items-center justify-center rounded-2xl font-semibold text-anil-50 hover:bg-white/20"}
    >
      {label}
    </Link>
  );
}
