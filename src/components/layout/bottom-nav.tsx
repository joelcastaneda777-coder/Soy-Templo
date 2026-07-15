"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/es";

const items = [
  { href: "/", label: t.nav.home, icon: HomeIcon },
  { href: "/devocionales", label: t.nav.devotionals, icon: BookIcon },
  { href: "/planes", label: t.nav.plans, icon: PathIcon },
  { href: "/eventos", label: t.nav.events, icon: CalendarIcon },
  { href: "/mas", label: t.nav.more, icon: DotsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-manta bg-white/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)] md:hidden dark:bg-papel/95"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-anil-600" : "text-tinta-suave hover:text-tinta"
                )}
              >
                <Icon className="h-6 w-6" filled={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { className?: string; filled?: boolean };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function HomeIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...(filled ? { fill: "currentColor" } : stroke)}>
      <path d="M3 10.5 12 3l9 7.5V21H14v-6h-4v6H3z" />
    </svg>
  );
}
function BookIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...(filled ? { fill: "currentColor" } : stroke)}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" fill="none" stroke={filled ? "var(--color-papel)" : "currentColor"} strokeWidth="1.8" />
    </svg>
  );
}
function PathIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="6" cy="5" r="2.4" fill={filled ? "currentColor" : "none"} />
      <circle cx="18" cy="19" r="2.4" fill={filled ? "currentColor" : "none"} />
      <path d="M8 6.5c5 2 3 9 8 11" />
    </svg>
  );
}
function CalendarIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" fill={filled ? "currentColor" : "none"} />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke={filled ? "var(--color-papel)" : "currentColor"} />
    </svg>
  );
}
function DotsIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <circle cx="5" cy="12" r={filled ? 2.4 : 1.8} />
      <circle cx="12" cy="12" r={filled ? 2.4 : 1.8} />
      <circle cx="19" cy="12" r={filled ? 2.4 : 1.8} />
    </svg>
  );
}
