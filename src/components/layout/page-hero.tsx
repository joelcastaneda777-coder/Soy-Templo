import type { ReactNode } from "react";

/**
 * Encabezado de página. La variante `abyssal` permite evolucionar la
 * paleta general sin alterar módulos con identidad visual propia.
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
  variant?: "legacy" | "abyssal";
}) {
  const backgroundClass =
    variant === "abyssal"
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
