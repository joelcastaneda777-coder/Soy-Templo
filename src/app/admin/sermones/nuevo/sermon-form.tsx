"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { createSermon, type SermonFormState } from "./actions";

export function SermonForm() {
  const [state, formAction, pending] = useActionState<SermonFormState, FormData>(createSermon, {});

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" required minLength={3} placeholder="El amor que transforma" />
      </Field>

      <Field label="Enlace del video (YouTube, Facebook, etc.)" htmlFor="videoUrl">
        <Input id="videoUrl" name="videoUrl" type="url" required placeholder="https://youtube.com/watch?v=..." />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="description">
        <Textarea id="description" name="description" maxLength={500} />
      </Field>

      <Field label="Imagen de portada (opcional)" htmlFor="thumbnailUrl">
        <Input id="thumbnailUrl" name="thumbnailUrl" type="url" placeholder="https://..." />
      </Field>

      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-anil-600" />
        Enviar notificación push a quienes la tengan activada
      </label>

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Publicando…" : "Publicar sermón"}
      </Button>
    </form>
  );
}
