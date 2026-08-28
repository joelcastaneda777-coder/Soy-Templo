// Service worker de Soy Templo: notificaciones push y recuperación de suscripciones.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { title: "Soy Templo", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Soy Templo", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || undefined,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target;
  try { target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin); }
  catch { target = new URL("/", self.location.origin); }
  if (target.origin !== self.location.origin) target = new URL("/", self.location.origin);

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (new URL(client.url).pathname === target.pathname && "focus" in client) return client.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(target.href) : undefined;
  }));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  const oldSubscription = event.oldSubscription;
  const applicationServerKey = oldSubscription && oldSubscription.options ? oldSubscription.options.applicationServerKey : null;
  if (!applicationServerKey) return;

  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }).then(async (subscription) => {
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys || !json.keys.p256dh || !json.keys.auth) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
  }).catch(() => undefined));
});
