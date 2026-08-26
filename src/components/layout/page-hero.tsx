import type { ReactNode } from "react";

/**
 * Encabezado de página con el mismo degradado de marca que el hero del
 * inicio, para que las páginas principales se sientan parte de la misma
 * app. Rompe el padding del contenedor `<main>` para llegar de borde a
 * borde (igual que en Home).
 *
 * No usar en páginas de lectura larga (detalle de devocional, que ya
 * tiene su propia "verse-band") ni encima de formularios complejos —
 * ahí el fondo claro y sólido sigue siendo lo más legible.
 */
export function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="hero-mesh -mx-4 -mt-4 space-y-3 rounded-b-[2rem] px-4 pb-6 pt-5 text-anil-50 md:-mx-6 md:px-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-anil-50/75">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
