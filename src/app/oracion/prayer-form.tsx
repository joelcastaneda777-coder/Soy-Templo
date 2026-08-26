"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Field, Input } from "@/components/ui/input";
import { submitPrayerRequest, type PrayerFormState } from "./actions";
import { t } from "@/lib/i18n/es";
import { useState } from "react";

export function PrayerForm() {
  const [state, formAction, pending] = useActionState<PrayerFormState, FormData>(submitPrayerRequest, {});
  const [allowContact, setAllowContact] = useState(false);

  if (state.ok) {
    return (
      <p role="status" className="rounded-[var(--radius-card)] bg-balsamo-100 p-5 text-center font-display text-balsamo-700">
        {t.prayer.sent}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <Field label={t.prayer.body} htmlFor="body">
        <Textarea id="body" name="body" required minLength={10} maxLength={2000} />
      </Field>

      <Field label={t.prayer.category} htmlFor="category">
        <Select id="category" name="category" defaultValue="general">
          <option value="salud">Salud</option>
          <option value="familia">Familia</option>
          <option value="provision">Provisión</option>
          <option value="gratitud">Gratitud</option>
          <option value="general">General</option>
        </Select>
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="isPublic" className="h-5 w-5 accent-anil-600" />
          {t.prayer.isPublic}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="isAnonymous" className="h-5 w-5 accent-anil-600" />
          {t.prayer.isAnonymous}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="allowContact"
            checked={allowContact}
            onChange={(e) => setAllowContact(e.target.checked)}
            className="h-5 w-5 accent-anil-600"
          />
          {t.prayer.allowContact}
        </label>
      </div>

      {allowContact ? (
        <Field label="Teléfono o correo de contacto" htmlFor="contactInfo">
          <Input id="contactInfo" name="contactInfo" autoComplete="tel" />
        </Field>
      ) : null}

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t.common.loading : t.prayer.submit}
      </Button>
    </form>
  );
}
