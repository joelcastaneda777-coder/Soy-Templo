"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { colorForCategory } from "@/lib/announcements/category-colors";

export type WeeklyAnnouncement = {
  id: string;
  title: string;
  description: string;
  category: string;
  actionLabel: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  featured: boolean;
};

const categoryLabels: Record<string, string> = {
  general: "General",
  jovenes: "Jóvenes",
  ninos: "Niños",
  mujeres: "Mujeres",
  hombres: "Hombres",
  discipulado: "Discipulado",
  servicio: "Servicio",
  creativo: "Creativo",
  especiales: "Especial",
};

export function WeeklyAnnouncementsCarousel({ items, variant = "light" }: { items: WeeklyAnnouncement[]; variant?: "light" | "dark" }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const dark = variant === "dark";

  function scrollToIndex(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller || !items.length) return;
    const normalized = (index + items.length) % items.length;
    const target = scroller.children.item(normalized) as HTMLElement | null;
    if (!target) return;
    const left = target.offsetLeft - (scroller.clientWidth - target.clientWidth) / 2;
    scroller.scrollTo({ left, behavior: "smooth" });
    setActiveIndex(normalized);
  }

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      scrollToIndex(activeIndex + 1);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [activeIndex, items.length]);

  function pauseAutoAdvance() {
    pauseUntilRef.current = Date.now() + 15000;
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    Array.from(scroller.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const childCenter = element.offsetLeft + element.clientWidth / 2;
      const nextDistance = Math.abs(childCenter - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    if (nearest !== activeIndex) setActiveIndex(nearest);
  }

  if (!items.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="weekly-announcements-title">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/48" : "text-tinta-suave"}`}>Esta semana</p>
          <h2 id="weekly-announcements-title" className={`font-display text-2xl font-semibold ${dark ? "text-white" : "text-anil-800"}`}>Anuncios</h2>
        </div>
        <Link href="/anuncios" className={`text-sm font-semibold ${dark ? "text-emerald-200" : "text-anil-600"}`}>Ver todos →</Link>
      </div>

      <div className="relative -mx-4 md:-mx-6">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          onPointerDown={pauseAutoAdvance}
          onTouchStart={pauseAutoAdvance}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[9vw] pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-[20vw] md:px-[24%]"
        >
          {items.map((item, index) => {
            const color = colorForCategory(item.category);
            const href = item.actionUrl || "/anuncios";
            const active = activeIndex === index;
            return (
              <article
                key={item.id}
                className={`relative w-[82vw] max-w-[430px] shrink-0 snap-center overflow-hidden rounded-[1.8rem] transition duration-300 ${dark ? "border border-white/10 bg-white/[0.045] shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl" : "border border-white/60 bg-white shadow-[0_14px_38px_rgba(11,43,38,0.12)] dark:border-white/10 dark:bg-manta"} ${active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"}`}
              >
                {item.imageUrl ? (
                  <div className="relative h-36 overflow-hidden">
                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="h-2" style={{ backgroundColor: color }} aria-hidden="true" />
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ backgroundColor: `${color}20`, borderColor: `${color}38`, color }}
                    >
                      {categoryLabels[item.category] ?? item.category}
                    </span>
                    {item.featured ? <span className={`text-xs font-semibold ${dark ? "text-emerald-200" : "text-cirio-600"}`}>★ Destacado</span> : null}
                  </div>
                  <h3 className={`mt-3 font-display text-xl font-semibold leading-tight ${dark ? "text-white" : "text-anil-900 dark:text-tinta"}`}>{item.title}</h3>
                  <p className={`mt-2 line-clamp-3 text-sm leading-relaxed ${dark ? "text-white/58" : "text-tinta-suave"}`}>{item.description}</p>
                  <Link href={href} className={`mt-4 inline-flex text-sm font-semibold ${dark ? "text-emerald-200" : "text-anil-600"}`}>
                    {item.actionLabel || "Ver anuncio"} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => { pauseAutoAdvance(); scrollToIndex(activeIndex - 1); }}
              aria-label="Anuncio anterior"
              className={`absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur md:flex ${dark ? "border border-white/10 bg-white/10 text-white" : "border border-manta bg-papel/90 text-anil-800"}`}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => { pauseAutoAdvance(); scrollToIndex(activeIndex + 1); }}
              aria-label="Anuncio siguiente"
              className={`absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur md:flex ${dark ? "border border-white/10 bg-white/10 text-white" : "border border-manta bg-papel/90 text-anil-800"}`}
            >
              →
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-label={`${activeIndex + 1} de ${items.length} anuncios`}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir al anuncio ${index + 1}`}
              onClick={() => { pauseAutoAdvance(); scrollToIndex(index); }}
              className={`h-1.5 rounded-full transition-all ${activeIndex === index ? (dark ? "w-6 bg-emerald-200" : "w-6 bg-anil-600") : (dark ? "w-1.5 bg-white/25" : "w-1.5 bg-anil-300/40")}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
