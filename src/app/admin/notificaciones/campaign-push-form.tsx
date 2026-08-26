"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { sendCampaignPush, type CampaignPushState } from "./actions";

export function CampaignPushForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<CampaignPushState, FormData>(sendCampaignPush, {});

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <Field label="Título de la notificación" htmlFor="title">
        <Input id="title" name="title" required maxLength={80} placeholder="Campaña de construcción" />
      </Field>

      <Field label="Mensaje" htmlFor="body">
        <Textarea id="body" name="body" required maxLength={200} placeholder="Ayúdanos a alcanzar la meta de este mes…" />
      </Field>

      <Field label="Destino de la donación (opcional)" htmlFor="categorySlug">
        <Select id="categorySlug" name="categorySlug" defaultValue="">
          <option value="">Sin destino específico</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </Field>

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
      {state.ok ? (
        <p role="status" className="rounded-xl bg-balsamo-100 p-3 text-sm font-semibold text-balsamo-700">
          Notificación enviada a {state.sent} {state.sent === 1 ? "persona" : "personas"}.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} variant="accent" className="w-full">
        {pending ? "Enviando…" : "Enviar notificación"}
      </Button>
    </form>
  );
}
