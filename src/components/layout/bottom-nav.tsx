"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n/es";
import { GlassSurface } from "@/components/liquid-glass/GlassSurface";
import { GlassGroup } from "@/components/liquid-glass/GlassGroup";
import { GlassPill } from "@/components/liquid-glass/GlassPill";
import { TransitionLink } from "@/components/layout/transition-link";

const items = [
  { href: "/", key: "home", label: t.nav.home, icon: HomeIcon },
  { href: "/devocionales", key: "devocionales", label: t.nav.devotionalsShort, icon: BookIcon },
  { href: "/planes", key: "planes", label: t.nav.plans, icon: PathIcon },
  { href: "/eventos", key: "eventos", label: t.nav.events, icon: CalendarIcon },
  { href: "/mas", key: "mas", label: t.nav.more, icon: DotsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLUListElement>(null);

  if (pathname.startsWith("/admin")) return null;

  const activeItem =
    items.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))) ?? items[0]!;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <GlassSurface
        variant="strong"
        tint="linear-gradient(155deg, rgba(7,24,23,0.64), rgba(12,35,32,0.48))"
        className="rounded-full border border-white/24 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.18)] [&_.glass-pill-indicator]:bg-white/88 [&_.glass-pill-indicator]:shadow-[0_4px_14px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.85)]"
      >
        <GlassGroup>
          <ul ref={containerRef} className="relative flex flex-1 items-stretch justify-around">
            <GlassPill containerRef={containerRef} activeKey={activeItem.key} />
            {items.map(({ href, key, label, icon: Icon }) => {
              const active = key === activeItem.key;
              return (
                <li key={href} className="relative z-10 flex-1">
                  <TransitionLink
                    href={href}
                    data-nav-key={key}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-semibold transition-colors",
                      active
                        ? "text-anil-950 drop-shadow-none"
                        : "text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" filled={active} />
                    {label}
                  </TransitionLink>
                </li>
              );
            })}
          </ul>
        </GlassGroup>
      </GlassSurface>
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
      <path d="M4 19a2 2 0 0 1 2-2h13" fill="none" stroke={filled ? "var(--color-anil-900)" : "currentColor"} strokeWidth="1.8" />
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
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke={filled ? "var(--color-anil-900)" : "currentColor"} />
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
