"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, UIEvent } from "react";
import { t } from "@/lib/i18n/es";

export type PlanThemeKey = "general" | "fe" | "miedo" | "esperanza" | "tristeza" | "gozo" | "identidad" | "gracia" | "sabiduria";

type Plan = {
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  duration_days: number;
  level: string;
  topic: string | null;
  access_tier: string | null;
  theme_key: PlanThemeKey | null;
};

type Theme = {
  label: string;
  accent: string;
  soft: string;
  page: string;
};

const THEMES: Record<PlanThemeKey, Theme> = {
  general: { label: "Descubrir", accent: "#8EB69B", soft: "rgba(142,182,155,.22)", page: "#102F2A" },
  fe: { label: "Fe", accent: "#A78BFA", soft: "rgba(167,139,250,.24)", page: "#241B3A" },
  miedo: { label: "Miedo", accent: "#F59E0B", soft: "rgba(245,158,11,.24)", page: "#332315" },
  esperanza: { label: "Esperanza", accent: "#34D399", soft: "rgba(52,211,153,.23)", page: "#12372D" },
  tristeza: { label: "Tristeza", accent: "#7DD3FC", soft: "rgba(125,211,252,.22)", page: "#162B3B" },
  gozo: { label: "Gozo", accent: "#FBBF24", soft: "rgba(251,191,36,.23)", page: "#382C13" },
  identidad: { label: "Identidad", accent: "#2DD4BF", soft: "rgba(45,212,191,.22)", page: "#113936" },
  gracia: { label: "Gracia", accent: "#FB7185", soft: "rgba(251,113,133,.22)", page: "#3B1C25" },
  sabiduria: { label: "Sabiduría", accent: "#60A5FA", soft: "rgba(96,165,250,.22)", page: "#172B46" },
};

function themeFor(plan: Plan) {
  return THEMES[plan.theme_key ?? "general"] ?? THEMES.general;
}

export function PlanGallery({ plans }: { plans: Plan[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePlan = plans[activeIndex] ?? plans[0];
  const activeTheme = activePlan ? themeFor(activePlan) : THEMES.general;

  const pageStyle = useMemo(() => ({
    "--plan-accent": activeTheme.accent,
    "--plan-page": activeTheme.page,
    background: `radial-gradient(circle at 20% 0%, ${activeTheme.soft}, transparent 34%), linear-gradient(160deg, ${activeTheme.page}, #071D1B 72%)`,
  }) as CSSProperties, [activeTheme]);

  useEffect(() => () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
  }, []);

  if (!plans.length) return null;

  function goTo(index: number) {
    const safe = Math.max(0, Math.min(index, plans.length - 1));
    slideRefs.current[safe]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(safe);
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const distance = Math.abs(slideCenter - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setActiveIndex(nearestIndex);
    }, 70);
  }

  return (
    <section
      className="relative left-1/2 -mt-4 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden text-white transition-[background] duration-700 md:-mt-4"
      style={pageStyle}
      aria-label="Planes bíblicos"
    >
      <div className="pointer-events-none absolute inset-0 opacity-55" style={{ background: `radial-gradient(circle at 82% 14%, ${activeTheme.soft}, transparent 28%)` }} />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[1100px] flex-col pb-24 pt-6 md:pb-10 md:pt-8">
        <header className="mb-4 flex items-end justify-between gap-4 px-5 sm:px-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">Biblioteca · Soy Templo</p>
            <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Planes</h1>
            <p className="mt-1 max-w-xl text-sm text-white/62">Desliza para explorar una experiencia distinta para cada momento de tu vida.</p>
          </div>
          <span className="hidden rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/72 backdrop-blur-xl sm:inline-flex">
            {activeIndex + 1} / {plans.length}
          </span>
        </header>

        <div
          ref={viewportRef}
          onScroll={handleScroll}
          className="plan-carousel-scroll flex flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto scroll-smooth px-[8vw] pb-3 pt-1 sm:gap-6 sm:px-[12vw] md:px-[15vw]"
          style={{ scrollbarWidth: "none", overscrollBehaviorX: "contain" }}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") goTo(activeIndex - 1);
            if (event.key === "ArrowRight") goTo(activeIndex + 1);
          }}
        >
          {plans.map((plan, index) => {
            const theme = themeFor(plan);
            const isActive = index === activeIndex;
            const isPlus = plan.access_tier === "plus";
            const image = plan.cover_url || "/plans/lesson-cover-example.jpg";

            return (
              <article
                key={plan.slug}
                ref={(node) => { slideRefs.current[index] = node; }}
                className={`relative h-[calc(100dvh-12.2rem)] min-h-[540px] max-h-[760px] w-[84vw] max-w-[760px] shrink-0 snap-center overflow-hidden rounded-[2.25rem] border transition-[transform,opacity,filter,box-shadow] duration-500 sm:w-[72vw] md:w-[64vw] ${isActive ? "scale-100 border-white/28 opacity-100 shadow-[0_35px_100px_rgba(0,0,0,.42)]" : "scale-[.94] border-white/12 opacity-55 saturate-[.78]"}`}
                style={{ backgroundColor: theme.page }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                  style={{ backgroundImage: `url(${JSON.stringify(image).slice(1, -1)})`, transform: isActive ? "scale(1.01)" : "scale(1.055)" }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.10)_0%,rgba(0,0,0,.05)_32%,rgba(4,20,20,.68)_66%,rgba(4,18,18,.96)_100%)]" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${theme.soft}, transparent 44%)` }} />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-7">
                  <span className="rounded-full border border-white/22 bg-black/18 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-sm backdrop-blur-xl" style={{ boxShadow: `inset 0 0 0 1px ${theme.soft}` }}>
                    {theme.label}
                  </span>
                  {isPlus ? (
                    <span className="rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-[#112D28] shadow-sm backdrop-blur-xl">Soy Templo+</span>
                  ) : (
                    <span className="rounded-full border border-white/18 bg-black/18 px-3 py-1.5 text-[11px] font-semibold text-white/88 backdrop-blur-xl">Gratis</span>
                  )}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="max-w-2xl">
                    {plan.topic ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/62">{plan.topic}</p> : null}
                    <h2 className="mt-2 max-w-[17ch] font-display text-[2rem] font-semibold leading-[1.02] text-white drop-shadow-md sm:text-5xl">{plan.name}</h2>
                    <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/76 sm:text-base">{plan.description || "Un recorrido guiado para profundizar en la Palabra y ponerla en práctica."}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl">{plan.duration_days} {t.plans.days}</span>
                      <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl">{t.plans.level[plan.level] ?? plan.level}</span>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <Link
                        href={`/planes/${plan.slug}`}
                        className="inline-flex items-center rounded-full px-5 py-3 text-sm font-bold text-[#0C2823] shadow-[0_12px_34px_rgba(0,0,0,.22)] transition hover:brightness-105"
                        style={{ backgroundColor: theme.accent }}
                      >
                        Abrir plan →
                      </Link>
                      {isPlus ? <span className="text-xs font-semibold text-white/62">Incluido con Soy Templo+</span> : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 px-5">
          <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/8 text-white/80 backdrop-blur-xl transition hover:bg-white/14 disabled:opacity-25" aria-label="Plan anterior">←</button>
          <div className="flex items-center gap-1.5" aria-label={`Plan ${activeIndex + 1} de ${plans.length}`}>
            {plans.map((plan, index) => (
              <button key={plan.slug} type="button" onClick={() => goTo(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? "w-7 bg-white" : "w-1.5 bg-white/30"}`} aria-label={`Ver ${plan.name}`} />
            ))}
          </div>
          <button type="button" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === plans.length - 1} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/8 text-white/80 backdrop-blur-xl transition hover:bg-white/14 disabled:opacity-25" aria-label="Plan siguiente">→</button>
        </div>
      </div>

      <style jsx global>{`
        .plan-carousel-scroll::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .plan-carousel-scroll { scroll-behavior: auto !important; }
        }
      `}</style>
    </section>
  );
}
