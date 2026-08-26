import type { HTMLAttributes, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { GlassHighlight } from "./GlassHighlight";

export type GlassVariant = "subtle" | "regular" | "strong";

export type GlassSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  /** Intensidad del material: subtle (chips/labels), regular (botones/tarjetas), strong (navegación/chrome). */
  variant?: GlassVariant;
  /** Marca la superficie como interactiva (cursor + respuesta al toque). */
  interactive?: boolean;
  /** Sobrescribe el fondo con un tinte propio (gradiente o color). */
  tint?: string;
  /** Oculta la capa de brillo superior-izquierdo si no hace falta. */
  showHighlight?: boolean;
};

/**
 * Superficie base del sistema Liquid Glass de Soy Templo.
 *
 * No es glassmorphism genérico de una sola capa: combina blur + saturación +
 * brillo, un degradado de fondo, borde translúcido, sombras internas (para
 * dar sensación de "borde óptico") y una capa de highlight independiente.
 *
 * No usar en contenido editorial largo (devocionales, formularios extensos)
 * — está pensado para interfaz y controles, no para texto de lectura.
 */
export function GlassSurface({
  variant = "regular",
  interactive = false,
  tint,
  showHighlight = true,
  className,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      data-variant={variant}
      data-interactive={interactive ? "true" : undefined}
      className={cn("glass-surface", className)}
      style={{
        ...(tint ? ({ "--lg-bg": tint } as CSSProperties) : null),
        ...style,
      }}
      {...props}
    >
      {showHighlight ? <GlassHighlight /> : null}
      {children}
    </div>
  );
}
