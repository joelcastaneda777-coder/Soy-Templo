"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/es";
import {
  defaultPushPreferences,
  disablePushSubscription,
  ensurePushSubscription,
  getPushServerStatus,
  isIos,
  isStandalonePwa,
  loadPushPreferences,
  registerPushWorker,
  supportsWebPush,
  syncPushSubscription,
  type PushPreferences,
  type PushServerStatus,
} from "@/lib/push/client";

const categoryLabels: { key: keyof PushPreferences; label: string }[] = [
  { key: "notify_devotional", label: t.notifications.categories.devotional },
  { key: "notify_verse", label: t.notifications.categories.verse },
  { key: "notify_events", label: t.notifications.categories.events },
  { key: "notify_sermons", label: t.notifications.categories.sermons },
  { key: "notify_prayer", label: "Oraciones de la comunidad" },
  { key: "notify_campaigns", label: t.notifications.categories.campaigns },
];

export function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [checking, setChecking] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<PushPreferences>(defaultPushPreferences);
  const [server, setServer] = useState<PushServerStatus | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshServerStatus() {
    const status = await getPushServerStatus();
    setServer(status);
    return status;
  }

  useEffect(() => {
    let cancelled = false;
    async function inspect() {
      const pushSupported = supportsWebPush();
      if (!cancelled) setSupported(pushSupported);
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
          if (cancelled) return;
          setSubscribed(true);
          setEndpoint(existing.endpoint);
          const loaded = await loadPushPreferences(existing.endpoint);
          if (loaded && !cancelled) setPrefs(loaded);
          const updated = await getPushServerStatus();
          if (!cancelled) setServer(updated);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.notifications.error);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    void inspect();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    if (!server?.authenticated || !server.configured || !server.publicKey) return;
    setPending(true); setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
      const subscription = await ensurePushSubscription(server.publicKey, prefs);
      setSubscribed(true);
      setEndpoint(subscription.endpoint);
      await refreshServerStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notifications.error);
    } finally { setPending(false); }
  }

  async function disable() {
    setPending(true); setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) await disablePushSubscription(subscription);
      setSubscribed(false); setEndpoint(null);
      await refreshServerStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notifications.error);
    } finally { setPending(false); }
  }

  async function togglePref(key: keyof PushPreferences) {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next); setError(null);
    if (!endpoint) return;
    try {
      const response = await fetch("/api/push/preferences", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, ...next }),
      });
      if (!response.ok) throw new Error(t.notifications.error);
    } catch {
      setPrefs(previous); setError(t.notifications.error);
    }
  }

  if (checking) return <div className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm text-tinta-suave dark:bg-manta">Comprobando notificaciones…</div>;
  if (!supported) return <p className="text-sm text-tinta-suave">{t.notifications.unsupported}</p>;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <div><h2 className="font-display text-lg font-semibold">{t.notifications.title}</h2><p className="mt-1 text-sm text-tinta-suave">{t.notifications.intro}</p></div>

      {!server?.authenticated ? (
        <div className="rounded-xl bg-anil-50 p-3 text-sm text-anil-900">Inicia sesión para vincular las notificaciones a tu cuenta. <Link href="/auth/login?next=/mas" className="font-semibold underline">Iniciar sesión</Link></div>
      ) : !server.configured ? (
        <p className="rounded-xl bg-cirio-100 p-3 text-sm text-anil-900">Las notificaciones push todavía no están configuradas en el servidor. El centro de notificaciones dentro de Soy Templo seguirá funcionando.</p>
      ) : null}

      {isIos() && !isStandalonePwa() ? <p className="rounded-xl bg-cirio-100 p-3 text-sm text-anil-900">{t.notifications.iosHint}</p> : null}
      {permission === "denied" ? <p className="rounded-xl bg-cirio-100 p-3 text-sm text-error">Las notificaciones están bloqueadas en este dispositivo. En Android puedes habilitarlas desde Ajustes → Aplicaciones → tu navegador o Soy Templo → Notificaciones.</p> : null}

      {server?.authenticated && server.configured && permission !== "denied" ? (
        <Button onClick={subscribed ? disable : enable} disabled={pending} variant={subscribed ? "ghost" : "primary"}>
          {pending ? "Guardando…" : subscribed ? "Desactivar en este dispositivo" : "Activar notificaciones en este dispositivo"}
        </Button>
      ) : null}

      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}

      {server?.authenticated ? <p className="text-xs text-tinta-suave">{server.registeredDevices === 1 ? "1 dispositivo vinculado a tu cuenta." : `${server.registeredDevices} dispositivos vinculados a tu cuenta.`}</p> : null}

      {subscribed ? (
        <div className="space-y-2 border-t border-manta pt-4">
          <p className="text-sm font-semibold text-balsamo-800">Notificaciones activas en este dispositivo ✓</p>
          {categoryLabels.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={prefs[key]} onChange={() => void togglePref(key)} className="h-5 w-5 accent-anil-600" />{label}</label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
