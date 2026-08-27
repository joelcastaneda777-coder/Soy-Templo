"use client";

import { useState } from "react";
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

/**
 * Galería de planes: una tarjeta al frente, con las vecinas asomando a
 * los lados — para explorar varios planes antes de elegir uno, como en
 * una galería de museo. Al tocar la tarjeta activa, entra al plan; al
 * tocar una vecina, solo la trae al frente.
 *
 * Todo el contenido vive en el flujo normal de la página (nada con
 * `position: fixed` aquí) para no interferir con la barra de
 * navegación de la app.
 */
export function PlanGallery({ plans }: { plans: Plan[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = plans[activeIndex];

  function goTo(index: number) {
    if (index < 0 || index >= plans.length) return;
    setActiveIndex(index);
  }

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div className="relative h-80 sm:h-96">
        {plans.map((plan, i) => {
          const offset = i - activeIndex;
          if (Math.abs(offset) > 1) return null;
          const isActive = offset === 0;
          const isPlus = plan.access_tier === "plus";

          const cardInner = (
            <>
              <div className="relative h-2/5 w-full">
                <Image
                  src="/plans/lesson-cover-example.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 420px"
                  className="object-cover"
                  priority={isActive}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-anil-900/90 via-transparent to-black/10" />
                {isPlus ? (
                  <span className="absolute left-4 top-4 rounded-full bg-cirio-500 px-3 py-1 text-xs font-bold text-anil-900">
                    Soy Templo+
                  </span>
                ) : null}
              </div>
              <div className="glass-dark flex h-3/5 flex-col gap-2 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="anil">{plan.duration_days} {t.plans.days}</Badge>
                  <Badge tone="balsamo">{t.plans.level[plan.level] ?? plan.level}</Badge>
                </div>
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className="line-clamp-2 text-sm text-anil-50/85">{plan.description}</p>
                {isActive ? (
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-cirio-100">
                    Ver plan →
                  </span>
                ) : null}
              </div>
            </>
          );

          const cardClasses = cn(
            "absolute inset-x-6 top-0 h-full overflow-hidden rounded-[var(--radius-card)] text-left shadow-xl transition-all duration-300 ease-out"
          );
          const cardStyle = {
            transform:
              offset === 0
                ? "translateX(0) scale(1)"
                : `translateX(${offset > 0 ? "78%" : "-78%"}) scale(0.9)`,
            opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.55,
            zIndex: isActive ? 30 : 10,
          };

          return isActive ? (
            <Link key={plan.slug} href={`/planes/${plan.slug}`} className={cardClasses} style={cardStyle}>
              {cardInner}
            </Link>
          ) : (
            <button
              key={plan.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver ${plan.name}`}
              className={cn(cardClasses, "cursor-pointer")}
              style={cardStyle}
            >
              {cardInner}
            </button>
          );
        })}
      </div>

      <div className="glass-dark mx-auto flex w-full max-w-xs items-center justify-between rounded-full px-2 py-2">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Plan anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full text-anil-50 disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-anil-50">
          {activeIndex + 1} de {plans.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === plans.length - 1}
          aria-label="Plan siguiente"
          className="flex h-10 w-10 items-center justify-center rounded-full text-anil-50 disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
