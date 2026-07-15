"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { t } from "@/lib/i18n/es";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(register, {});

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl font-semibold text-anil-800">{t.auth.register}</h1>
      {state.message ? (
        <p role="status" className="mt-6 rounded-[--radius-card] bg-balsamo-100 p-5 text-balsamo-700">
          {state.message}
        </p>
      ) : (
        <>
          <form action={formAction} className="mt-6 space-y-4">
            <Field label={t.auth.fullName} htmlFor="fullName">
              <Input id="fullName" name="fullName" autoComplete="name" required />
            </Field>
            <Field label={t.auth.email} htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field label={t.auth.password} htmlFor="password">
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </Field>
            {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? t.common.loading : t.auth.register}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-tinta-suave">
            {t.auth.hasAccount}{" "}
            <Link href="/auth/login" className="font-semibold text-anil-600">{t.auth.login}</Link>
          </p>
        </>
      )}
    </div>
  );
}
