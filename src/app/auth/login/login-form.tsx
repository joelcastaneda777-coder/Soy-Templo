"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { t } from "@/lib/i18n/es";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl font-semibold text-anil-800">{t.auth.login}</h1>
      <form action={formAction} className="mt-6 space-y-4">
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t.auth.password} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
        </Field>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.common.loading : t.auth.login}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-tinta-suave">
        {t.auth.noAccount}{" "}
        <Link href="/auth/registro" className="font-semibold text-anil-600">{t.auth.register}</Link>
      </p>
    </div>
  );
}
