"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { setRecoveredPassword, type NewPasswordState } from "./actions";

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setRecoveredPassword, {});
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="font-display text-3xl font-semibold text-anil-800">Nueva contraseña</h1>
      <p className="mt-2 text-sm text-tinta-suave">Crea una contraseña nueva de al menos 8 caracteres.</p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="Nueva contraseña" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} /></Field>
        <Field label="Confirmar contraseña" htmlFor="confirmPassword"><Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} /></Field>
        {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Guardando…" : "Guardar nueva contraseña"}</Button>
      </form>
    </div>
  );
}
