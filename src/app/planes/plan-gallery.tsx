"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { t } from "@/lib/i18n/es";

type Plan = {
  slug: string;
  name: string;
  description: string | null;
  duration_days: number;
  level: string;
  topic: string | null;
  access_tier: string | null;
  visual_theme: string | null;
  accent_color: string | null;
  cover_image_url: string | null;
};

const THEME_LABELS: Record<string, string> = {
  faith: "Fe",
  fear: "Miedo",
  hope: "Esperanza",
  sadness: "Tristeza",
  joy: "Gozo",
  grace: "Gracia",
  identity: "Identidad",
  wisdom: "Sabiduría",
  rest: "Descanso",
  theology: "Teología",
};

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return `rgba(91,95,239,${alpha})`;
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function PlanGallery({ plans }: { plans: Plan[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const frame = useRef<number | null>(null);

  const activePlan = plans[activeIndex] ?? plans[0];
  const pageAccent = activePlan?.accent_color || "#5B5FEF";

  const pageStyle = useMemo(
    () =>
      ({
        "--plan-accent": pageAccent,
        "--plan-accent-soft": hexToRgba(pageAccent, 0.32),
      }) as CSSProperties,
    [pageAccent]
  );

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  if (!plans.length) return null;

  function scrollTo(index: number) {
    const normalized = Math.max(0, Math.min(plans.length - 1, index));
    cardRefs.current[normalized]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function updateActiveFromScroll() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const center = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
      let bestIndex = activeIndex;
      let bestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex !== activeIndex) setActiveIndex(bestIndex);
    });
  }

  return (
    <section
      className="relative left-1/2 -mt-4 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 overflow-hidden bg-[#071b1b] text-white md:-mt-4"
      style={pageStyle}
      aria-label="Planes bíblicos"
    >
      <div
        className="pointer-events-none absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 18% 12%, ${hexToRgba(pageAccent, 0.36)}, transparent 34%), radial-gradient(circle at 86% 75%, ${hexToRgba(pageAccent, 0.2)}, transparent 34%), linear-gradient(180deg,#071b1b 0%,#061414 100%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 bg-gradient-to-b from-black/45 to-transparent" />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-5 pb-4 pt-7 sm:px-8 md:pt-9">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/58">Biblioteca Soy Templo</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Planes</h1>
          <p className="mt-1 max-w-xl text-sm text-white/68">Desliza para explorar. Cada recorrido tiene una identidad visual propia según su tema.</p>
        </div>
        <span className="hidden rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/75 backdrop-blur-xl sm:inline-flex">
          {activeIndex + 1} / {plans.length}
        </span>
      </header>

      <div className="relative z-20">
        <div
          ref={scrollerRef}
          onScroll={updateActiveFromScroll}
          className="plan-real-carousel flex snap-x snap-mandatory gap-4 overflow-x-auto px-[7vw] pb-4 pt-2 sm:gap-6 sm:px-[calc(50vw-310px)]"
          style={{ scrollbarWidth: "none", scrollPaddingInline: "7vw" }}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") scrollTo(activeIndex - 1);
            if (event.key === "ArrowRight") scrollTo(activeIndex + 1);
          }}
        >
          {plans.map((plan, index) => {
            const accent = plan.accent_color || "#5B5FEF";
            const isActive = index === activeIndex;
            const isPlus = plan.access_tier === "plus";
            const themeLabel = THEME_LABELS[plan.visual_theme || ""] || plan.topic || "Plan bíblico";
            const image = plan.cover_image_url || "/plans/lesson-cover-example.jpg";

            return (
              <article
                key={plan.slug}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                className={`relative h-[68dvh] min-h-[500px] max-h-[720px] w-[86vw] max-w-[620px] shrink-0 snap-center overflow-hidden rounded-[2.2rem] border transition-[transform,opacity,filter] duration-500 sm:h-[72dvh] ${
                  isActive
                    ? "scale-100 border-white/30 opacity-100 shadow-[0_30px_90px_rgba(0,0,0,0.48)]"
                    : "scale-[0.94] border-white/12 opacity-55 saturate-[0.78]"
                }`}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 86vw, 620px"
                  className="object-cover"
                  priority={index < 2}
                  draggable={false}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/90" />
                <div
                  className="absolute inset-0 mix-blend-soft-light transition-colors duration-500"
                  style={{ background: `linear-gradient(145deg, ${hexToRgba(accent, 0.62)}, transparent 44%, ${hexToRgba(accent, 0.22)})` }}
                />
                <div
                  className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full blur-3xl"
                  style={{ backgroundColor: hexToRgba(accent, 0.44) }}
                />

                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-7">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-xl"
                      style={{ backgroundColor: hexToRgba(accent, 0.58) }}
                    >
                      {themeLabel}
                    </span>
                    {isPlus ? (
                      <span className="rounded-full border border-white/25 bg-[#dce7a4]/92 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#18352f] shadow-sm backdrop-blur-xl">
                        Soy Templo+
                      </span>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-white/18 bg-black/18 px-3 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-xl">
                    {plan.duration_days} {t.plans.days}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="max-w-[34rem]">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/68">
                      <span>{t.plans.level[plan.level] ?? plan.level}</span>
                      {plan.topic ? <><span>•</span><span>{plan.topic}</span></> : null}
                    </div>
                    <h2 className="font-display text-[2rem] font-semibold leading-[1.02] text-white drop-shadow-sm sm:text-[2.7rem]">
                      {plan.name}
                    </h2>
                    <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/78 sm:text-base">
                      {plan.description || "Un recorrido guiado para profundizar en la Palabra y ponerla en práctica."}
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <Link
                        href={`/planes/${plan.slug}`}
                        className="inline-flex items-center rounded-full border border-white/22 bg-white/92 px-5 py-2.5 text-sm font-bold text-[#12332d] shadow-lg transition hover:scale-[1.02] hover:bg-white"
                      >
                        Ver plan →
                      </Link>
                      <span className="text-xs font-medium text-white/60">{plan.duration_days} días</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pb-8 pt-2 sm:px-8">
          <button
            type="button"
            onClick={() => scrollTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/14 disabled:opacity-25"
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-1.5" aria-label={`Plan ${activeIndex + 1} de ${plans.length}`}>
            {plans.map((plan, index) => (
              <button
                key={plan.slug}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Ir a ${plan.name}`}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: index === activeIndex ? 28 : 8,
                  backgroundColor: index === activeIndex ? pageAccent : "rgba(255,255,255,.28)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollTo(activeIndex + 1)}
            disabled={activeIndex === plans.length - 1}
            className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/14 disabled:opacity-25"
          >
            Siguiente →
          </button>
        </div>
      </div>

      <style jsx global>{`
        .plan-real-carousel::-webkit-scrollbar { display: none; }
        .plan-real-carousel { -ms-overflow-style: none; }
        @media (prefers-reduced-motion: reduce) {
          .plan-real-carousel { scroll-behavior: auto !important; }
        }
      `}</style>
    </section>
  );
}
