import Link from "next/link";
import Image from "next/image";
import { t } from "@/lib/i18n/es";
import { createClient } from "@/lib/supabase/server";

/** Navegación superior para escritorio (server component: conoce la sesión). */
export async function DesktopNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const links = [
    { href: "/devocionales", label: t.nav.devotionals },
    { href: "/planes", label: t.nav.plans },
    { href: "/eventos", label: t.nav.events },
    { href: "/anuncios", label: t.nav.announcements },
    { href: "/oracion", label: t.nav.prayer },
  ];

  return (
    <header className="sticky top-0 z-40 hidden border-b border-manta bg-papel/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo.png"
            alt={t.app.name}
            width={36}
            height={34}
            className="brand-logo-dark h-9 w-auto"
            priority
          />
          <Image
            src="/brand/logo-light.png"
            alt={t.app.name}
            width={36}
            height={34}
            className="brand-logo-light h-9 w-auto"
            priority
          />
          <span className="font-display text-xl font-semibold text-anil-800 dark:text-tinta">
            {t.app.name}
          </span>
        </Link>
        <nav aria-label="Navegación principal" className="flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-tinta-suave hover:text-anil-600">
              {l.label}
            </Link>
          ))}
          <Link
            href="/donar"
            className="rounded-full bg-cirio-500 px-5 py-2 text-sm font-semibold text-anil-900 hover:brightness-95"
          >
            {t.nav.donate}
          </Link>
          <Link href={user ? "/mas" : "/auth/login"} className="text-sm font-medium text-anil-600">
            {user ? t.nav.profile : t.auth.login}
          </Link>
        </nav>
      </div>
    </header>
  );
}
