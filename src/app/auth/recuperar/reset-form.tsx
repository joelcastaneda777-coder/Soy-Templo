"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { requestPasswordReset, type ResetRequestState } from "./actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl font-semibold text-anil-800">Recuperar contraseña</h1>
      <p className="mt-2 text-sm leading-relaxed text-tinta-suave">Escribe el correo de tu cuenta y te enviaremos un enlace seguro para crear una nueva contraseña.</p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="Correo electrónico" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
        {state.message ? <p role="status" className="rounded-xl bg-balsamo-50 p-3 text-sm text-balsamo-800">{state.message}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Enviando…" : "Enviar enlace"}</Button>
      </form>
      <p className="mt-5 text-center text-sm"><Link href="/auth/login" className="font-semibold text-anil-600">Volver a iniciar sesión</Link></p>
    </div>
  );
}
