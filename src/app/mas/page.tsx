import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { logout } from "@/app/auth/actions";
import { NotificationSettings } from "@/components/notifications/notification-settings";

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isStaff = false;
  let careMembership: { active: boolean } | null = null;
  let roles: { role: string }[] = [];
  let unreadCount = 0;

  if (user) {
    const [staffResult, careResult, roleResult, notificationResult] = await Promise.all([
      supabase.rpc("is_staff"),
      supabase.from("care_team_members").select("active").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
    ]);
    isStaff = Boolean(staffResult.data);
    careMembership = careResult.data as { active: boolean } | null;
    roles = (roleResult.data ?? []) as { role: string }[];
    unreadCount = notificationResult.count ?? 0;
  }

  const isCareAdmin = roles.some((row) => row.role === "admin" || row.role === "superadmin");
  const links = [
    { href: "/biblia", label: "Biblia", icon: "✦" },
    { href: "/donar", label: t.nav.donate, icon: "♡" },
    { href: "/oracion", label: t.nav.prayer, icon: "◌" },
    { href: "/sermones", label: "Sermones", icon: "▶" },
    { href: "/favoritos", label: t.nav.favorites, icon: "☆" },
    { href: "/progreso", label: t.nav.progress, icon: "↗" },
    { href: "/perfil", label: t.nav.profile, icon: "◉" },
    { href: "/configuracion", label: t.nav.settings, icon: "⚙" },
    { href: "/acerca-de", label: t.nav.about, icon: "i" },
  ];

  return (
    <div className="space-y-6">
      <PageHero title={t.nav.more} subtitle="Tu cuenta, comunidad y herramientas en un solo lugar." variant="editorial" />

      <div className="mx-auto max-w-3xl space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/plus" className="group relative overflow-hidden rounded-[1.9rem] border border-[#063F47]/10 bg-[radial-gradient(circle_at_85%_12%,rgba(255,255,255,.28),transparent_28%),linear-gradient(145deg,#063F47,#0A5559)] p-6 text-white shadow-[0_20px_45px_rgba(6,63,71,.14)] sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-white/55">Premium</p>
            <div className="mt-2 flex items-end justify-between gap-4"><div><h2 className="font-display text-3xl font-semibold tracking-[-.02em]">Soy Templo+</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-white/68">Planes especializados, archivo ampliado y nuevas herramientas para profundizar.</p></div><span className="text-2xl transition-transform group-hover:translate-x-1" aria-hidden>→</span></div>
          </Link>

          {user ? <Link href="/notificaciones" className="rounded-[1.7rem] border border-[#063F47]/10 bg-white/68 p-5 shadow-[0_12px_30px_rgba(6,63,71,.07)] backdrop-blur-xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Actividad</p><div className="mt-2 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold text-[#063F47]">Notificaciones</h2>{unreadCount ? <span className="rounded-full bg-[#063F47] px-2.5 py-1 text-xs font-bold text-white">{unreadCount}</span> : <span className="text-sm text-[#063F47]/45">Al día</span>}</div></Link> : null}

          {isStaff ? <Link href="/admin" className="rounded-[1.7rem] border border-[#063F47]/10 bg-[#D9EEE4] p-5 shadow-[0_12px_30px_rgba(6,63,71,.07)]"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Equipo</p><h2 className="mt-2 font-display text-xl font-semibold text-[#063F47]">{t.nav.admin} →</h2></Link> : null}
        </section>

        <NotificationSettings />

        {(careMembership?.active || isCareAdmin) ? <section className="grid gap-3 sm:grid-cols-2">{careMembership?.active ? <Link href="/cuidado" className="rounded-[1.6rem] border border-[#063F47]/10 bg-white/65 p-5 font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">Equipo de cuidado →</Link> : null}{isCareAdmin ? <Link href="/admin/cuidado/equipo" className="rounded-[1.6rem] border border-[#063F47]/10 bg-white/65 p-5 font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">Configurar equipo pastoral →</Link> : null}</section> : null}

        <nav aria-label="Más opciones">
          <ul className="grid gap-3 sm:grid-cols-2">{links.map((l) => <li key={l.href}><Link href={l.href} className="group flex min-h-24 items-center justify-between rounded-[1.6rem] border border-[#063F47]/10 bg-white/66 p-5 shadow-[0_10px_26px_rgba(6,63,71,.055)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#0A6A68]/30"><span className="font-semibold text-[#063F47]">{l.label}</span><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#063F47]/8 bg-[#E8F5EE] text-sm text-[#0A6A68] transition group-hover:bg-[#D8EEE3]" aria-hidden>{l.icon}</span></Link></li>)}</ul>
        </nav>

        {user ? <form action={logout}><button className="w-full rounded-[1.5rem] border border-[#A23B3B]/12 bg-white/60 p-4 font-semibold text-error shadow-sm backdrop-blur-xl">{t.auth.logout}</button></form> : <Link href="/auth/login" className="block rounded-[1.5rem] bg-[#063F47] p-4 text-center font-semibold text-white shadow-[0_10px_24px_rgba(6,63,71,.16)]">{t.auth.login}</Link>}
      </div>
    </div>
  );
}
