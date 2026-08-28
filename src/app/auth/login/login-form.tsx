"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, resendConfirmation, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { t } from "@/lib/i18n/es";

export function LoginForm({ next, passwordUpdated = false }: { next?: string; passwordUpdated?: boolean }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(login, {});
  const [resendState, resendAction, resendPending] = useActionState<AuthState, FormData>(resendConfirmation, {});

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl font-semibold text-anil-800">{t.auth.login}</h1>
      {passwordUpdated ? <p role="status" className="mt-4 rounded-xl bg-balsamo-50 p-3 text-sm text-balsamo-800">Tu contraseña fue actualizada. Ya puedes iniciar sesión.</p> : null}
      <form action={formAction} className="mt-6 space-y-4">
        <Field label={t.auth.email} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.email ?? ""} />
        </Field>
        <Field label={t.auth.password} htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
        </Field>
        <div className="text-right"><Link href="/auth/recuperar" className="text-sm font-semibold text-anil-600">¿Olvidaste tu contraseña?</Link></div>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? t.common.loading : t.auth.login}
        </Button>
      </form>

      {state.needsConfirmation && state.email ? (
        <div className="mt-4 rounded-2xl border border-cirio-200 bg-cirio-50 p-4">
          <p className="text-sm leading-relaxed text-anil-900">
            Te enviaremos un enlace nuevo a <strong>{state.email}</strong>. Al confirmarlo entrarás a la sección de oración.
          </p>
          <form action={resendAction} className="mt-3">
            <input type="hidden" name="email" value={state.email} />
            <Button type="submit" variant="secondary" disabled={resendPending} className="w-full">
              {resendPending ? "Enviando…" : "Reenviar correo de confirmación"}
            </Button>
          </form>
          {resendState.message ? <p role="status" className="mt-3 text-sm text-balsamo-800">{resendState.message}</p> : null}
          {resendState.error ? <p role="alert" className="mt-3 text-sm text-error">{resendState.error}</p> : null}
        </div>
      ) : null}

      <p className="mt-4 text-center text-sm text-tinta-suave">
        {t.auth.noAccount}{" "}
        <Link href="/auth/registro" className="font-semibold text-anil-600">{t.auth.register}</Link>
      </p>
    </div>
  );
}
