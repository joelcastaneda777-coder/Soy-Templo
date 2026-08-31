import type { ReactNode } from "react";

/**
 * Encabezado compartido. `editorial` es la nueva identidad visual general.
 * `legacy` y `abyssal` conservan exactamente su presentación previa para no
 * alterar módulos con una identidad visual ya aprobada.
 */
export function PageHero({
  title,
  subtitle,
  children,
  variant = "legacy",
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: "legacy" | "abyssal" | "editorial";
}) {
  if (variant !== "editorial") {
    const backgroundClass = variant === "abyssal"
      ? "bg-[radial-gradient(circle_at_18%_15%,rgba(82,143,143,0.28),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(6,133,98,0.18),transparent_30%),linear-gradient(155deg,#063547_0%,#084B53_42%,#04383F_72%,#021F25_100%)]"
      : "hero-mesh";

    return (
      <section className={`${backgroundClass} -mx-4 -mt-4 space-y-3 overflow-hidden rounded-b-[2rem] px-4 pb-6 pt-5 text-anil-50 md:-mx-6 md:px-6`}>
        <div>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-1 text-anil-50/75">{subtitle}</p> : null}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="relative -mx-4 -mt-4 space-y-3 overflow-hidden rounded-b-[2.25rem] border-b border-[#063F47]/10 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,.95),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(6,133,98,.14),transparent_28%),radial-gradient(circle_at_78%_86%,rgba(6,63,71,.12),transparent_30%),linear-gradient(145deg,#F5FBF7_0%,#E7F5ED_46%,#CBE7DA_100%)] px-4 pb-7 pt-6 text-[#063F47] shadow-[0_18px_45px_rgba(6,63,71,.08)] md:-mx-6 md:px-6">
      <span aria-hidden className="pointer-events-none absolute -right-9 top-4 h-24 w-24 rounded-full border border-white/55 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-xl" />
      <span aria-hidden className="pointer-events-none absolute right-20 top-20 h-12 w-12 rounded-full border border-[#063F47]/10 bg-white/20 backdrop-blur-xl" />
      <div className="relative z-10 max-w-2xl">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#0A6A68]/72">Soy Templo</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#063F47]/68 sm:text-base">{subtitle}</p> : null}
      </div>
      {children ? <div className="relative z-10">{children}</div> : null}
    </section>
  );
}
