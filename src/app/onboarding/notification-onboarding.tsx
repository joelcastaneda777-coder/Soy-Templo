"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "./actions";
import {
  defaultPushPreferences,
  ensurePushSubscription,
  getPushServerStatus,
  isIos,
  isStandalonePwa,
  registerPushWorker,
  supportsWebPush,
  syncPushSubscription,
  type PushServerStatus,
} from "@/lib/push/client";

export function NotificationOnboarding() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [server, setServer] = useState<PushServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [finishing, startTransition] = useTransition();
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function inspect() {
      const pushSupported = supportsWebPush();
      if (!cancelled) { setSupported(pushSupported); setIosNeedsInstall(isIos() && !isStandalonePwa()); }
      if (!pushSupported) { if (!cancelled) setChecking(false); return; }
      if (!cancelled) setPermission(Notification.permission);
      try {
        const status = await getPushServerStatus();
        if (cancelled) return;
        setServer(status);
        const registration = await registerPushWorker();
        const existing = await registration.pushManager.getSubscription();
        if (existing && status.authenticated && status.configured) {
          await syncPushSubscription(existing);
          if (!cancelled) { setSubscribed(true); setPermission("granted"); }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudieron comprobar las notificaciones.");
      } finally { if (!cancelled) setChecking(false); }
    }
    void inspect();
    return () => { cancelled = true; };
  }, []);

  function finish() { startTransition(async () => { await completeOnboarding(); }); }

  async function enableNotifications() {
    if (!server?.authenticated) { finish(); return; }
    if (!server.configured || !server.publicKey) { finish(); return; }
    setPending(true); setError(null);
    try {
      const result = await Notification.requestPermission(); setPermission(result);
      if (result !== "granted") return;
      await ensurePushSubscription(server.publicKey, defaultPushPreferences);
      setSubscribed(true); finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron activar las notificaciones.");
    } finally { setPending(false); }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-10">
      <div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-anil-100 text-3xl">🔔</div><h1 className="mt-4 font-display text-3xl font-semibold text-anil-800">Mantente conectado</h1><p className="mt-2 text-sm leading-relaxed text-tinta-suave">Activa las notificaciones para recibir devocionales, sermones, eventos, avisos importantes y nuevas oraciones de la comunidad.</p></div>
      <div className="rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta"><ul className="space-y-3 text-sm"><li>✓ Devocional y verso del día</li><li>✓ Nuevos sermones y estudios</li><li>✓ Eventos y recordatorios</li><li>✓ Nuevas oraciones de la comunidad</li><li>✓ Anuncios importantes</li></ul></div>

      {iosNeedsInstall ? <p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">En iPhone, instala Soy Templo en la pantalla de inicio y abre la app desde su icono para activar notificaciones.</p> : null}
      {server && !server.configured ? <p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">El push aún no está configurado en el servidor. Puedes continuar; los avisos dentro de Soy Templo seguirán disponibles.</p> : null}
      {!server?.authenticated && !checking ? <p className="rounded-xl bg-anil-50 p-4 text-sm text-anil-900">Primero debes iniciar sesión para vincular un dispositivo. Al continuar te llevaremos al acceso.</p> : null}

      {checking ? <Button disabled className="w-full">Comprobando…</Button> : !supported || !server?.configured || !server.authenticated ? (
        <Button onClick={finish} disabled={finishing} className="w-full">{finishing ? "Continuando…" : "Continuar"}</Button>
      ) : subscribed ? (
        <Button onClick={finish} disabled={finishing} className="w-full">{finishing ? "Entrando…" : "Continuar a Soy Templo"}</Button>
      ) : permission === "denied" ? (
        <div className="space-y-3"><p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">Las notificaciones están bloqueadas desde el dispositivo. Puedes habilitarlas más tarde en Más → Notificaciones.</p><Button onClick={finish} disabled={finishing} variant="secondary" className="w-full">Continuar sin notificaciones</Button></div>
      ) : (
        <Button onClick={enableNotifications} disabled={pending || iosNeedsInstall} className="w-full">{pending ? "Activando…" : "Activar notificaciones y continuar"}</Button>
      )}
      {error ? <p role="alert" className="text-center text-sm text-error">{error}</p> : null}
      <p className="text-center text-xs leading-relaxed text-tinta-suave">El permiso final lo controla tu dispositivo. Puedes cambiar tus preferencias después desde Más.</p>
    </div>
  );
}
