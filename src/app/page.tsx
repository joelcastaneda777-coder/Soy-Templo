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

  const [devotionalRes, eventRes, announcementRes, settingsRes] = await Promise.all([
    supabase
      .from("devotionals")
      .select("slug, title, bible_reading, key_verse")
      .eq("status", "published")
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("slug, name, starts_at, location")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("announcements")
      .select("id, title, description, action_label, action_url")
      .eq("status", "published")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("app_settings").select("value").eq("key", "church_info").maybeSingle(),
  ]);

  const devotional = devotionalRes.data;
  const event = eventRes.data;
  const announcement = announcementRes.data;
  const streamUrl = (settingsRes.data?.value as { stream_url?: string } | null)?.stream_url;

  return (
    <div className="space-y-6">
      {/* Hero: degradado de marca + vidrio flotante. Rompe el padding
          del contenedor principal para llegar de borde a borde. */}
      <section className="hero-mesh -mx-4 -mt-4 space-y-5 rounded-b-[2rem] px-4 pb-6 pt-5 md:-mx-6 md:px-6">
        <div className="flex items-center gap-2">
          <Image src="/brand/logo-light.png" alt="" width={40} height={38} className="h-9 w-auto" priority />
          <span className="font-display text-lg font-semibold text-anil-50">{t.app.name}</span>
        </div>

        <div>
          <p className="text-sm font-medium text-anil-50/70">{greetingByHour()}</p>
        </div>

        {streamUrl ? (
          <a
            href={streamUrl}
            className="glass-chip flex items-center gap-3 rounded-2xl p-4 font-semibold text-anil-50"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="h-3 w-3 rounded-full bg-red-400" />
            </span>
            {t.home.liveNow}
          </a>
        ) : null}

        {devotional ? (
          <Link href={`/devocionales/${devotional.slug}`} className="block">
            <div className="glass rounded-[--radius-card] p-6 text-anil-50">
              <p className="text-xs font-semibold uppercase tracking-wider text-cirio-100">
                {t.home.todayDevotional}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">{devotional.title}</h2>
              <p className="mt-3 font-display text-lg italic leading-relaxed opacity-95">
                {devotional.key_verse}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cirio-100">
                {t.home.readMore} →
              </p>
            </div>
          </Link>
        ) : null}

        <div aria-label={t.home.quickActions} className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink href="/donar" label={t.nav.donate} accent />
          <QuickLink href="/oracion" label={t.nav.prayer} />
          <QuickLink href="/planes" label={t.nav.plans} />
          <QuickLink href="/radio" label={t.radio.title} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {event ? (
          <Card>
            <Badge tone="balsamo">{t.home.nextEvent}</Badge>
            <h2 className="mt-2 font-display text-xl font-semibold">{event.name}</h2>
            <p className="mt-1 text-sm text-tinta-suave">
              {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
            </p>
            {event.location ? <p className="text-sm text-tinta-suave">{event.location}</p> : null}
            <Link href="/eventos" className="mt-3 inline-block text-sm font-semibold text-anil-600">
              {t.events.upcoming} →
            </Link>
          </Card>
        ) : null}

        {announcement ? (
          <Card>
            <Badge tone="cirio">{t.home.featuredAnnouncement}</Badge>
            <h2 className="mt-2 font-display text-xl font-semibold">{announcement.title}</h2>
            <p className="mt-1 line-clamp-3 text-sm text-tinta-suave">{announcement.description}</p>
            <Link href="/anuncios" className="mt-3 inline-block text-sm font-semibold text-anil-600">
              {t.nav.announcements} →
            </Link>
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
      className={
        accent
          ? "flex min-h-16 items-center justify-center rounded-2xl bg-cirio-500 font-semibold text-anil-900 shadow-sm hover:brightness-95"
          : "glass-chip flex min-h-16 items-center justify-center rounded-2xl font-semibold text-anil-50 hover:bg-white/20"
      }
    >
      {label}
    </Link>
  );
}
