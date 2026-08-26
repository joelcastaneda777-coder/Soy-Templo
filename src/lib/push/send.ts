import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Capa de envío de notificaciones push.
 * Solo se usa en el servidor (rutas API, Server Actions, cron) — nunca
 * en el cliente. Usa la service role key porque necesita leer todas las
 * suscripciones, saltándose RLS.
 */

type PushCategory = "devotional" | "verse" | "events" | "sermons" | "campaigns";

const categoryColumn: Record<PushCategory, string> = {
  devotional: "notify_devotional",
  verse: "notify_verse",
  events: "notify_events",
  sermons: "notify_sermons",
  campaigns: "notify_campaigns",
};

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Faltan las claves VAPID en las variables de entorno.");
  }
  webpush.setVapidDetails("mailto:hola@soytemplo.org", publicKey, privateKey);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Envía un push a todas las suscripciones activas de una categoría. */
export async function sendPushToCategory(
  category: PushCategory,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  configureWebPush();
  const supabase = getServiceClient();
  const column = categoryColumn[category];

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq(column, true);

  if (error || !subscriptions) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // 404/410 = la suscripción ya no existe (el usuario la revocó o desinstaló la app)
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) expiredIds.push(sub.id);
      }
    })
  );

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, failed };
}
