export type PushPreferences = {
  notify_devotional: boolean;
  notify_verse: boolean;
  notify_events: boolean;
  notify_sermons: boolean;
  notify_campaigns: boolean;
  notify_prayer: boolean;
  notify_announcements: boolean;
};

export const defaultPushPreferences: PushPreferences = {
  notify_devotional: true,
  notify_verse: true,
  notify_events: true,
  notify_sermons: true,
  notify_campaigns: true,
  notify_prayer: true,
  notify_announcements: true,
};

export type PushServerStatus = {
  authenticated: boolean;
  configured: boolean;
  publicKey: string | null;
  registeredDevices: number;
};

export function supportsWebPush() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function isIos() {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function getDeviceName() {
  if (typeof navigator === "undefined") return "Dispositivo";
  const ua = navigator.userAgent;
  const platform = /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iPhone/iPad" : /windows/i.test(ua) ? "Windows" : /macintosh/i.test(ua) ? "Mac" : "Dispositivo";
  const browser = /SamsungBrowser/i.test(ua) ? "Samsung Internet" : /Edg\//i.test(ua) ? "Edge" : /CriOS|Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Navegador";
  return `${platform} · ${browser}`.slice(0, 80);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function hasSameApplicationKey(subscription: PushSubscription, publicKey: string) {
  const current = subscription.options.applicationServerKey;
  if (!current) return false;
  const expected = urlBase64ToUint8Array(publicKey);
  const actual = new Uint8Array(current);
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export async function registerPushWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  try { await registration.update(); } catch { /* El worker actual sigue siendo válido. */ }
  return registration;
}

export async function getPushServerStatus(): Promise<PushServerStatus> {
  const response = await fetch("/api/push/status", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new Error("No se pudo comprobar el estado de las notificaciones.");
  return response.json();
}

export async function syncPushSubscription(subscription: PushSubscription, preferences?: PushPreferences) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("La suscripción del navegador está incompleta.");
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, deviceName: getDeviceName(), ...(preferences ? { preferences } : {}) }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "No se pudo vincular este dispositivo.");
  }
  return response.json();
}

export async function loadPushPreferences(endpoint: string): Promise<PushPreferences | null> {
  const response = await fetch(`/api/push/preferences?endpoint=${encodeURIComponent(endpoint)}`, { cache: "no-store", credentials: "same-origin" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudieron cargar las preferencias.");
  const data = await response.json();
  return data?.preferences ? { ...defaultPushPreferences, ...data.preferences } : null;
}

export async function ensurePushSubscription(publicKey: string, preferences: PushPreferences) {
  const registration = await registerPushWorker();
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !hasSameApplicationKey(subscription, publicKey)) {
    try {
      await fetch("/api/push/unsubscribe", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
    } catch { /* La rotación del navegador puede continuar. */ }
    await subscription.unsubscribe();
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  }
  await syncPushSubscription(subscription, preferences);
  return subscription;
}

export async function disablePushSubscription(subscription: PushSubscription) {
  const response = await fetch("/api/push/unsubscribe", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  if (!response.ok) throw new Error("No se pudo desvincular este dispositivo.");
  await subscription.unsubscribe();
}
