"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setEventAttendance, type AttendanceState } from "./actions";

export function RegistrationPanel({ eventId, slug, mode, capacity, registeredCount, initial }: {
  eventId: string; slug: string; mode: "rsvp" | "registration"; capacity: number | null; registeredCount: number;
  initial: { id: string; party_size: number } | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AttendanceState, FormData>(setEventAttendance, {});
  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);
  const remaining = capacity == null ? null : Math.max(capacity - registeredCount, 0);

  return (
    <section className="rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <h2 className="font-display text-xl font-semibold">{mode === "rsvp" ? "¿Nos acompañas?" : "Inscripción"}</h2>
      {remaining != null ? <p className="mt-1 text-sm text-tinta-suave">{remaining > 0 ? `${remaining} cupos disponibles` : "Cupos completos"}</p> : null}
      {initial ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-balsamo-700">✓ Tu asistencia está confirmada{initial.party_size > 1 ? ` para ${initial.party_size} personas` : ""}.</p>
          <form action={action} className="mt-3"><input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="intent" value="cancel" /><button disabled={pending} className="rounded-xl border border-manta px-4 py-2 text-sm font-semibold">Cancelar mi asistencia</button></form>
        </div>
      ) : (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="intent" value="join" />
          <label className="text-sm font-medium">Personas<input name="partySize" type="number" min="1" max="20" defaultValue="1" className="mt-1 block w-24 rounded-xl border border-manta bg-transparent px-3 py-2" /></label>
          <button disabled={pending || remaining === 0} className="rounded-xl bg-anil-700 px-4 py-2 text-sm font-semibold text-white">{pending ? "Guardando…" : mode === "rsvp" ? "Sí, asistiré" : "Inscribirme"}</button>
        </form>
      )}
      {state.error ? <p role="alert" className="mt-3 text-sm text-error">{state.error}{state.needsLogin ? <> <Link className="font-semibold underline" href={`/auth/login?next=/eventos/${slug}`}>Iniciar sesión</Link></> : null}</p> : null}
    </section>
  );
}
