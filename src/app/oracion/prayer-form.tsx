"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Field, Input } from "@/components/ui/input";
import { submitPrayerRequest, type PrayerFormState } from "./actions";
import { t } from "@/lib/i18n/es";

export function PrayerForm() {
  const [state, formAction, pending] = useActionState<PrayerFormState, FormData>(submitPrayerRequest, {});
  const [allowContact, setAllowContact] = useState(false);

  if (state.ok) {
    return (
      <div role="status" className="rounded-[var(--radius-card)] bg-balsamo-100 p-5 text-center text-balsamo-800">
        <p className="font-display text-lg font-semibold">{t.prayer.sent}</p>
        <p className="mt-2 text-sm">La petición quedó en revisión. Si pediste que sea pública, aparecerá en el muro únicamente después de moderación.</p>
      </div>
    );
  }

  return (
    <form id="pedir-oracion" action={formAction} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <div>
        <h2 className="font-display text-xl font-semibold text-anil-800">Pedir oración</h2>
        <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
          Puedes enviarla de forma privada o pedir que, después de moderación, la compartamos con la comunidad para que más personas oren contigo.
        </p>
      </div>

      <Field label={t.prayer.body} htmlFor="body">
        <Textarea id="body" name="body" required minLength={10} maxLength={2000} />
      </Field>

      <Field label={t.prayer.category} htmlFor="category">
        <Select id="category" name="category" defaultValue="general">
          <option value="salud">Salud</option>
          <option value="familia">Familia</option>
          <option value="provision">Provisión</option>
          <option value="duelo">Duelo</option>
          <option value="espiritual">Vida espiritual</option>
          <option value="trabajo">Trabajo / estudios</option>
          <option value="gratitud">Gratitud</option>
          <option value="general">General</option>
        </Select>
      </Field>

      <div className="space-y-3 rounded-2xl border border-manta p-4">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="isPublic" className="mt-0.5 h-5 w-5 accent-anil-600" />
          <span>{t.prayer.isPublic} <span className="block text-xs text-tinta-suave">Nunca se publica automáticamente: primero pasa por revisión.</span></span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="isAnonymous" className="mt-0.5 h-5 w-5 accent-anil-600" />
          <span>{t.prayer.isAnonymous}</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="allowContact"
            checked={allowContact}
            onChange={(e) => setAllowContact(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-anil-600"
          />
          <span>{t.prayer.allowContact} <span className="block text-xs text-tinta-suave">Tu dato de contacto nunca aparece en el muro público.</span></span>
        </label>
      </div>

      {allowContact ? (
        <Field label="Teléfono, WhatsApp o correo" htmlFor="contactInfo">
          <Input id="contactInfo" name="contactInfo" required autoComplete="tel" />
        </Field>
      ) : null}

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.common.loading : t.prayer.submit}
      </Button>
    </form>
  );
}
