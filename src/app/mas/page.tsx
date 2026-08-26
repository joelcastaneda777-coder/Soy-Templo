import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";
import { logout } from "@/app/auth/actions";
import { NotificationSettings } from "@/components/notifications/notification-settings";

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isStaff } = user ? await supabase.rpc("is_staff") : { data: false };

  const links = [
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
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-3xl font-semibold text-anil-800">{t.nav.more}</h1>

      <NotificationSettings />

      <nav aria-label="Más opciones">
        <ul className="divide-y divide-manta overflow-hidden rounded-[var(--radius-card)] border border-manta bg-white dark:bg-manta">
          {isStaff ? (
            <li>
              <Link href="/admin" className="flex min-h-14 items-center px-5 font-semibold text-anil-600">
                {t.nav.admin} →
              </Link>
            </li>
          ) : null}
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-14 items-center px-5 font-medium hover:bg-anil-50">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {user ? (
        <form action={logout}>
          <button className="w-full rounded-[var(--radius-card)] border border-manta bg-white p-4 font-semibold text-error dark:bg-manta">
            {t.auth.logout}
          </button>
        </form>
      ) : (
        <Link
          href="/auth/login"
          className="block rounded-[var(--radius-card)] bg-anil-600 p-4 text-center font-semibold text-white"
        >
          {t.auth.login}
        </Link>
      )}
    </div>
  );
}
