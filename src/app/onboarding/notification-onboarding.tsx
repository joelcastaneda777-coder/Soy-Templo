"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "./actions";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalonePwa() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function NotificationOnboarding() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [finishing, startTransition] = useTransition();
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(pushSupported);
    setIosNeedsInstall(isIos() && !isStandalonePwa());
    if (!pushSupported) return;

    setPermission(Notification.permission);
    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        setPermission("granted");
      }
    }).catch(() => setSupported(false));
  }, []);

  function finish() {
    startTransition(async () => {
      await completeOnboarding();
    });
  }

  async function enableNotifications() {
    setPending(true);
    setError(null);
    try {
      if (!VAPID_PUBLIC_KEY) throw new Error("Las notificaciones aún no están configuradas en el servidor.");

      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          preferences: {
            notify_devotional: true,
            notify_verse: true,
            notify_events: true,
            notify_sermons: true,
            notify_campaigns: true,
            notify_prayer: true,
          },
        }),
      });
      if (!response.ok) throw new Error("No se pudo registrar este dispositivo para notificaciones.");

      setSubscribed(true);
      finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron activar las notificaciones.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-10">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-anil-100 text-3xl">🔔</div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-anil-800">Mantente conectado</h1>
        <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
          Activa las notificaciones para recibir devocionales, sermones, eventos, avisos importantes y nuevas oraciones de la comunidad.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
        <ul className="space-y-3 text-sm">
          <li>✓ Devocional y verso del día</li>
          <li>✓ Nuevos sermones y estudios</li>
          <li>✓ Eventos y recordatorios</li>
          <li>✓ Nuevas oraciones de la comunidad</li>
          <li>✓ Anuncios importantes</li>
        </ul>
      </div>

      {iosNeedsInstall ? (
        <p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">
          En iPhone, las notificaciones web funcionan cuando Soy Templo está instalada en la pantalla de inicio. Abre esta experiencia desde el icono de la app y vuelve a intentarlo.
        </p>
      ) : null}

      {!supported ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">
            Este dispositivo o navegador no permite notificaciones push en esta modalidad.
          </p>
          <Button onClick={finish} disabled={finishing} className="w-full">
            {finishing ? "Entrando…" : "Continuar a Soy Templo"}
          </Button>
        </div>
      ) : subscribed ? (
        <Button onClick={finish} disabled={finishing} className="w-full">
          {finishing ? "Entrando…" : "Continuar a Soy Templo"}
        </Button>
      ) : permission === "denied" ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-cirio-100 p-4 text-sm text-anil-900">
            Las notificaciones fueron bloqueadas desde el sistema. Puedes habilitarlas después desde los permisos de la app o el navegador.
          </p>
          <Button onClick={finish} disabled={finishing} variant="secondary" className="w-full">
            {finishing ? "Entrando…" : "Continuar sin notificaciones"}
          </Button>
        </div>
      ) : (
        <Button onClick={enableNotifications} disabled={pending || iosNeedsInstall} className="w-full">
          {pending ? "Activando…" : "Activar notificaciones y continuar"}
        </Button>
      )}

      {error ? <p role="alert" className="text-center text-sm text-error">{error}</p> : null}

      <p className="text-center text-xs leading-relaxed text-tinta-suave">
        El permiso final de notificaciones lo controla tu dispositivo. Puedes cambiar tus preferencias más adelante dentro de la app.
      </p>
    </div>
  );
}
