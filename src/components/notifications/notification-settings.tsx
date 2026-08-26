"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/es";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Prefs = {
  notify_devotional: boolean;
  notify_verse: boolean;
  notify_events: boolean;
  notify_sermons: boolean;
  notify_campaigns: boolean;
};

const defaultPrefs: Prefs = {
  notify_devotional: true,
  notify_verse: true,
  notify_events: true,
  notify_sermons: true,
  notify_campaigns: true,
};

const categoryLabels: { key: keyof Prefs; label: string }[] = [
  { key: "notify_devotional", label: t.notifications.categories.devotional },
  { key: "notify_verse", label: t.notifications.categories.verse },
  { key: "notify_events", label: t.notifications.categories.events },
  { key: "notify_sermons", label: t.notifications.categories.sermons },
  { key: "notify_campaigns", label: t.notifications.categories.campaigns },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    const supportsPush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(supportsPush);
    if (!supportsPush) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        setEndpoint(existing.endpoint);
      }
    });
  }, []);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      if (!VAPID_PUBLIC_KEY) {
        setError("Falta configurar la clave de notificaciones en el servidor (NEXT_PUBLIC_VAPID_PUBLIC_KEY).");
        setPending(false);
        return;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setPending(false);
        return;
      }

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
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          preferences: prefs,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "subscribe-failed");
      }

      setSubscribed(true);
      setEndpoint(subscription.endpoint);
    } catch (err) {
      setError(err instanceof Error && err.message && !err.message.includes("subscribe-failed")
        ? err.message
        : t.notifications.error);
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setEndpoint(null);
    } catch {
      setError(t.notifications.error);
    } finally {
      setPending(false);
    }
  }

  function togglePref(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    if (endpoint) {
      fetch("/api/push/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, ...next }),
      }).catch(() => setError(t.notifications.error));
    }
  }

  if (!supported) {
    return <p className="text-sm text-tinta-suave">{t.notifications.unsupported}</p>;
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <div>
        <h2 className="font-display text-lg font-semibold">{t.notifications.title}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t.notifications.intro}</p>
      </div>

      {isIos() && !isStandalonePwa() ? (
        <p className="rounded-xl bg-cirio-100 p-3 text-sm text-anil-900">{t.notifications.iosHint}</p>
      ) : null}

      {permission === "denied" ? (
        <p className="text-sm text-error">{t.notifications.blocked}</p>
      ) : (
        <Button onClick={subscribed ? disable : enable} disabled={pending} variant={subscribed ? "ghost" : "primary"}>
          {pending ? t.notifications.enabling : subscribed ? t.notifications.disable : t.notifications.enable}
        </Button>
      )}

      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}

      {subscribed ? (
        <div className="space-y-2 border-t border-manta pt-4">
          <p className="text-sm font-semibold text-anil-800">{t.notifications.enabled} ✓</p>
          {categoryLabels.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => togglePref(key)}
                className="h-5 w-5 accent-anil-600"
              />
              {label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
