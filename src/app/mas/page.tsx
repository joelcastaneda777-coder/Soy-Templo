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
    { href: "/biblia", label: "Biblia" },
    { href: "/donar", label: t.nav.donate },
    { href: "/oracion", label: t.nav.prayer },
    { href: "/radio", label: t.nav.streams },
    { href: "/sermones", label: "Sermones" },
    { href: "/anuncios", label: t.nav.announcements },
    { href: "/favoritos", label: t.nav.favorites },
    { href: "/progreso", label: t.nav.progress },
    { href: "/perfil", label: t.nav.profile },
    { href: "/configuracion", label: t.nav.settings },
    { href: "/acerca-de", label: t.nav.about },
  ];

  return (
    <div className="space-y-4">
      <PageHero title={t.nav.more} variant="abyssal" />
      <div className="mx-auto max-w-md space-y-4">
        <NotificationSettings />
        <nav aria-label="Más opciones">
          <ul className="divide-y divide-manta overflow-hidden rounded-[var(--radius-card)] border border-manta bg-white dark:bg-manta">
            {user ? <li><Link href="/notificaciones" className="flex min-h-14 items-center justify-between px-5 font-semibold text-[#063547]"><span>Notificaciones</span>{unreadCount ? <span className="rounded-full bg-[#063547] px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}</Link></li> : null}
            {isStaff ? <li><Link href="/admin" className="flex min-h-14 items-center px-5 font-semibold text-[#063547]">{t.nav.admin} →</Link></li> : null}
            {careMembership?.active ? <li><Link href="/cuidado" className="flex min-h-14 items-center px-5 font-semibold text-[#0d5d63]">Equipo de cuidado →</Link></li> : null}
            {isCareAdmin ? <li><Link href="/admin/cuidado/equipo" className="flex min-h-14 items-center px-5 font-semibold text-[#0d5d63]">Configurar equipo pastoral →</Link></li> : null}
            {links.map((l) => <li key={l.href}><Link href={l.href} className="flex min-h-14 items-center px-5 font-medium hover:bg-[#e7f1f1]">{l.label}</Link></li>)}
          </ul>
        </nav>
        {user ? <form action={logout}><button className="w-full rounded-[var(--radius-card)] border border-manta bg-white p-4 font-semibold text-error dark:bg-manta">{t.auth.logout}</button></form> : <Link href="/auth/login" className="block rounded-[var(--radius-card)] bg-[#063547] p-4 text-center font-semibold text-white hover:bg-[#084B53]">{t.auth.login}</Link>}
      </div>
    </div>
  );
}
