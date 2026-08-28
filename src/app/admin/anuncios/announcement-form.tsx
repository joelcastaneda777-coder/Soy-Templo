"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createAnnouncement, type AnnouncementState } from "./actions";

export function AnnouncementForm() {
  const [state, action, pending] = useActionState<AnnouncementState, FormData>(createAnnouncement, {});
  return <form action={action} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
    <Field label="Título" htmlFor="title"><Input id="title" name="title" required /></Field>
    <Field label="Descripción" htmlFor="description"><Textarea id="description" name="description" required /></Field>
    <Field label="Imagen (opcional)" htmlFor="imageUrl"><Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." /></Field>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tipo de anuncio" htmlFor="kind"><Select id="kind" name="kind" defaultValue="aviso"><option value="aviso">Aviso</option><option value="cambio">Cambio</option><option value="cancelacion">Cancelación</option><option value="recordatorio">Recordatorio</option><option value="campana">Campaña</option><option value="convocatoria">Convocatoria</option><option value="clima">Clima</option></Select></Field>
      <Field label="Categoría" htmlFor="category"><Select id="category" name="category" defaultValue="general"><option value="general">Información general</option><option value="jovenes">Jóvenes</option><option value="ninos">Niños</option><option value="mujeres">Mujeres</option><option value="hombres">Hombres</option><option value="discipulado">Discipulado</option><option value="servicio">Servicio comunitario</option><option value="creativo">Ministerio creativo</option><option value="especiales">Actividades especiales</option></Select></Field>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Aplica desde" htmlFor="effectiveAt"><Input id="effectiveAt" name="effectiveAt" type="datetime-local" required /></Field>
      <Field label="Aplica hasta (opcional)" htmlFor="effectiveUntil"><Input id="effectiveUntil" name="effectiveUntil" type="datetime-local" /></Field>
    </div>
    <p className="text-xs text-tinta-suave">Esta es la fecha que verá la congregación en el mural. Ejemplo: puedes publicarlo el viernes, pero marcar que aplica el domingo.</p>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Publicar desde" htmlFor="publishAt"><Input id="publishAt" name="publishAt" type="datetime-local" required /></Field>
      <Field label="Ocultar después (opcional)" htmlFor="expiresAt"><Input id="expiresAt" name="expiresAt" type="datetime-local" /></Field>
    </div>

    <div className="grid gap-4 sm:grid-cols-2"><Field label="Texto del botón (opcional)" htmlFor="actionLabel"><Input id="actionLabel" name="actionLabel" placeholder="Ver detalles" /></Field><Field label="Enlace del botón (opcional)" htmlFor="actionUrl"><Input id="actionUrl" name="actionUrl" placeholder="/eventos o https://..." /></Field></div>
    <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" /> Destacar anuncio</label><Field label="Prioridad (0-100)" htmlFor="priority"><Input id="priority" name="priority" type="number" min="0" max="100" defaultValue="50" /></Field></div>

    {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
    {state.ok ? <p role="status" className="text-sm font-semibold text-balsamo-700">Anuncio guardado correctamente.</p> : null}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Guardando…" : "Guardar anuncio"}</Button>
  </form>;
}
