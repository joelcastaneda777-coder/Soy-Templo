import Link from "next/link";

export function PlusGate({
  title = "Contenido de Soy Templo+",
  description = "Este contenido forma parte de Soy Templo+. La suscripción se activará mediante Google Play cuando publiquemos la app Android.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-anil-200 bg-anil-50/70 p-6 text-center">
      <span className="inline-flex rounded-full bg-anil-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Soy Templo+</span>
      <h2 className="mt-3 font-display text-2xl font-semibold text-anil-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-tinta-suave">{description}</p>
      <Link
        href="/plus"
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-anil-600 px-6 font-semibold text-white hover:bg-anil-800"
      >
        Conocer Soy Templo+
      </Link>
    </div>
  );
}
