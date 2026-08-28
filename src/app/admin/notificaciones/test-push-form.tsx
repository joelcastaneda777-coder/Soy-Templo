"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendTestPush, type TestPushState } from "./actions";

export function TestPushForm() {
  const [state, action, pending] = useActionState<TestPushState, FormData>(async () => sendTestPush(), {});
  return <form action={action} className="space-y-3">
    <Button type="submit" disabled={pending}>{pending ? "Enviando prueba…" : "Enviar prueba a mis dispositivos"}</Button>
    {state.ok ? <p role="status" className="text-sm text-balsamo-800">{state.message} Enviadas: {state.sent ?? 0}{state.failed ? ` · Fallidas: ${state.failed}` : ""}.</p> : null}
    {state.error ? <p role="alert" className="text-sm text-cirio-800">{state.error}</p> : null}
    {state.fallback ? <p className="text-xs text-tinta-suave">También se guardó una copia en tu Centro de notificaciones interno.</p> : null}
  </form>;
}
