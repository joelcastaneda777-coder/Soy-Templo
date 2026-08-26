"use client";

import { useEffect, useState, type RefObject } from "react";

type Rect = { x: number; width: number };

/**
 * Indicador activo que se desliza entre elementos hermanos dentro de un
 * contenedor con `position: relative`.
 *
 * Es el equivalente web más cercano a `glassEffectID` + `@Namespace` de
 * Apple (transformación coordinada entre estados) sin necesitar Framer
 * Motion ni la View Transitions API: mide la posición del elemento activo
 * (marcado con `data-nav-key`) y anima un `div` compartido con `transform`.
 *
 * Requiere que cada elemento candidato tenga el atributo
 * `data-nav-key="<clave>"` dentro de `containerRef`.
 */
export function GlassPill({
  containerRef,
  activeKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  activeKey: string;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const activeEl = container!.querySelector<HTMLElement>(`[data-nav-key="${activeKey}"]`);
      if (!activeEl) return;
      const containerRect = container!.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setRect({ x: elRect.left - containerRect.left, width: elRect.width });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeKey, containerRef]);

  if (!rect) return null;

  return (
    <span
      className="glass-pill-indicator"
      style={{ transform: `translateX(${rect.x}px)`, width: rect.width }}
      aria-hidden
    />
  );
}
