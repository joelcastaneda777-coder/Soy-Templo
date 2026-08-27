"use client";

import { useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n/es";
import { cn } from "@/lib/utils";

type Plan = {
  slug: string;
  name: string;
  description: string | null;
  duration_days: number;
  level: string;
  topic: string | null;
  access_tier: string | null;
};

type CardPosition = -2 | -1 | 0 | 1 | 2;

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

function getRelativePosition(index: number, activeIndex: number, total: number) {
  let distance = index - activeIndex;
  const half = total / 2;

  if (distance > half) distance -= total;
  if (distance < -half) distance += total;

  return distance;
}

function getCardStyle(position: CardPosition): CSSProperties {
  const styles: Record<CardPosition, CSSProperties> = {
    0: {
      transform: "translate3d(-50%, 0, 0) scale(1) rotateY(0deg)",
      opacity: 1,
      zIndex: 40,
      filter: "brightness(1) saturate(1)",
    },
    [-1]: {
      transform: "translate3d(calc(-50% - min(43vw, 245px)), 22px, -75px) scale(0.88) rotateY(7deg)",
      opacity: 0.52,
      zIndex: 30,
      filter: "brightness(0.72) saturate(0.8)",
    },
    1: {
      transform: "translate3d(calc(-50% + min(43vw, 245px)), 22px, -75px) scale(0.88) rotateY(-7deg)",
      opacity: 0.52,
      zIndex: 30,
      filter: "brightness(0.72) saturate(0.8)",
    },
    [-2]: {
      transform: "translate3d(calc(-50% - min(67vw, 375px)), 42px, -150px) scale(0.76) rotateY(10deg)",
      opacity: 0.2,
      zIndex: 20,
      filter: "brightness(0.58) saturate(0.68)",
    },
    2: {
      transform: "translate3d(calc(-50% + min(67vw, 375px)), 42px, -150px) scale(0.76) rotateY(-10deg)",
      opacity: 0.2,
      zIndex: 20,
      filter: "brightness(0.58) saturate(0.68)",
    },
  };

  return styles[position];
}

/**
 * Galería coverflow de planes.
 *
 * La tarjeta activa queda anclada al centro y las tarjetas vecinas se
 * distribuyen a ambos lados con profundidad. El carrusel es circular para
 * mantener la composición balanceada incluso en el primer y último plan.
 * La navegación visual se hace directamente con swipe/drag horizontal,
 * teclado o tocando una tarjeta vecina.
 */
export function PlanGallery({ plans }: { plans: Plan[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStartX = useRef<number | null>(null);
  const suppressNextClick = useRef(false);

  if (!plans.length) return null;

  function goTo(index: number) {
    setActiveIndex(wrapIndex(index, plans.length));
  }

  function goBy(delta: number) {
    setActiveIndex((current) => wrapIndex(current + delta, plans.length));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (plans.length <= 1) return;
    pointerStartX.current = event.clientX;
    suppressNextClick.current = false;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null || plans.length <= 1) return;

    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(delta) < 45) return;

    suppressNextClick.current = true;
    goBy(delta < 0 ? 1 : -1);
  }

  function handleCardClick(event: ReactMouseEvent<HTMLElement>, index: number, isActive: boolean) {
    if (suppressNextClick.current) {
      event.preventDefault();
      suppressNextClick.current = false;
      return;
    }

    if (!isActive) {
      event.preventDefault();
      goTo(index);
    }
  }

  return (
    <section className="relative -mx-4 overflow-hidden px-4 pb-2 sm:-mx-6 sm:px-6" aria-label="Galería de planes bíblicos">
      <div
        className="relative mx-auto h-[444px] w-full max-w-4xl select-none sm:h-[468px]"
        style={{ perspective: "1200px", touchAction: "pan-y" }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") goBy(-1);
          if (event.key === "ArrowRight") goBy(1);
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-20 h-52 w-[72vw] max-w-2xl -translate-x-1/2 rounded-full bg-anil-300/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-36 h-40 w-[54vw] max-w-xl -translate-x-1/2 rounded-full bg-cirio-500/15 blur-3xl" />

        {plans.map((plan, index) => {
          const rawPosition = getRelativePosition(index, activeIndex, plans.length);
          if (Math.abs(rawPosition) > 2) return null;

          const position = rawPosition as CardPosition;
          const isActive = position === 0;
          const isPlus = plan.access_tier === "plus";
          const cardStyle = getCardStyle(position);

          const content = (
            <>
              <div className="relative h-[40%] w-full overflow-hidden bg-anil-900">
                <Image
                  src="/plans/lesson-cover-example.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 78vw, 360px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                  priority={isActive}
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-anil-900/85" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(142,182,155,0.34),transparent_46%)]" />

                <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                  {isPlus ? (
                    <span className="rounded-full border border-anil-50/25 bg-cirio-500/95 px-3 py-1 text-[11px] font-bold text-anil-900 shadow-sm backdrop-blur-md">
                      Soy Templo+
                    </span>
                  ) : (
                    <span className="rounded-full border border-anil-50/20 bg-anil-900/45 px-3 py-1 text-[11px] font-semibold text-anil-50 backdrop-blur-md">
                      Plan bíblico
                    </span>
                  )}

                  {plan.topic ? (
                    <span className="max-w-[48%] truncate rounded-full border border-anil-50/15 bg-anil-900/35 px-3 py-1 text-[10px] font-medium text-anil-50/90 backdrop-blur-md">
                      {plan.topic}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex h-[60%] flex-col bg-[linear-gradient(155deg,rgba(35,83,71,0.94),rgba(5,31,32,0.97))] p-5 text-anil-50 backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="anil">{plan.duration_days} {t.plans.days}</Badge>
                  <Badge tone="balsamo">{t.plans.level[plan.level] ?? plan.level}</Badge>
                </div>

                <h3 className="mt-3 line-clamp-2 font-display text-[1.35rem] font-semibold leading-[1.12] text-anil-50 sm:text-2xl">
                  {plan.name}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-anil-50/78">
                  {plan.description || "Un recorrido guiado para profundizar en la Palabra y ponerla en práctica."}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-sm font-semibold text-cirio-100">
                    {isActive ? "Ver plan →" : "Tocar para ver"}
                  </span>
                  {isActive ? (
                    <span className="h-2 w-2 rounded-full bg-cirio-500 shadow-[0_0_0_5px_rgba(142,182,155,0.13)]" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
            </>
          );

          const sharedClasses = cn(
            "group absolute left-1/2 top-3 h-[400px] w-[78vw] max-w-[350px] origin-center overflow-hidden rounded-[2rem] border border-anil-50/15 text-left shadow-[0_22px_55px_rgba(5,31,32,0.32)] transition-[transform,opacity,filter,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:top-4 sm:h-[420px] sm:w-[360px] sm:max-w-[360px]",
            isActive
              ? "plan-card-hop pointer-events-auto shadow-[0_28px_70px_rgba(5,31,32,0.42)]"
              : "cursor-pointer hover:opacity-70"
          );

          if (isActive) {
            return (
              <Link
                key={plan.slug}
                href={`/planes/${plan.slug}`}
                className={sharedClasses}
                style={cardStyle}
                aria-label={`Abrir el plan ${plan.name}`}
                onClick={(event) => handleCardClick(event, index, true)}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={plan.slug}
              type="button"
              className={sharedClasses}
              style={cardStyle}
              aria-label={`Traer al frente el plan ${plan.name}`}
              onClick={(event) => handleCardClick(event, index, false)}
            >
              {content}
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes plan-card-hop {
          0%, 100% { translate: 0 0; }
          46% { translate: 0 -9px; }
          72% { translate: 0 2px; }
        }

        .plan-card-hop {
          animation: plan-card-hop 380ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .plan-card-hop { animation: none; }
        }
      `}</style>
    </section>
  );
}
