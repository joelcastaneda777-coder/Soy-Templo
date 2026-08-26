import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Agrupa varias superficies de vidrio relacionadas (por ejemplo, los ítems
 * de una navegación) con espaciado y contexto compartido.
 *
 * A diferencia de `GlassEffectContainer` en SwiftUI, esto NO fusiona
 * físicamente las formas en una sola gota (metaball) — esa técnica requiere
 * filtros SVG pesados con impacto real en rendimiento en móviles de gama
 * baja. `GlassGroup` mantiene la sensación de "mismo material" mediante
 * espaciado consistente y sirviendo de contenedor posicional para
 * indicadores compartidos como `GlassPill`.
 */
export function GlassGroup({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex items-center", className)} {...props}>
      {children}
    </div>
  );
}
