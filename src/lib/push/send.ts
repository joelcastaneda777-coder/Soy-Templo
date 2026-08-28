import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type PushCategory = "devotional" | "verse" | "events" | "sermons" | "campaigns" | "prayer";
const categoryColumn: Record<PushCategory, string> = { devotional: "notify_devotional", verse: "notify_verse", events: "notify_events", sermons: "notify_sermons", campaigns: "notify_campaigns", prayer: "notify_prayer" };

export function isPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Faltan las claves VAPID en las variables de entorno.");
  webpush.setVapidDetails("mailto:hola@soytemplo.org", publicKey, privateKey);
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };
type PushSubscriptionRow = { id: string; endpoint: string; p256dh: string; auth_key: string };

async function deliver(subscriptions: PushSubscriptionRow[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured()) return { sent: 0, failed: subscriptions.length };
  configureWebPush();
  const supabase = getServiceClient(); let sent = 0; let failed = 0; const expiredIds: string[] = [];
  await Promise.all(subscriptions.map(async (sub) => {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, JSON.stringify(payload)); sent++; }
    catch (err: unknown) { failed++; const statusCode = (err as { statusCode?: number })?.statusCode; if (statusCode === 404 || statusCode === 410) expiredIds.push(sub.id); }
  }));
  if (expiredIds.length) await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  return { sent, failed };
}

export async function sendPushToCategory(category: PushCategory, payload: PushPayload) {
  if (!isPushConfigured()) return { sent: 0, failed: 0 };
  const { data, error } = await getServiceClient().from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq(categoryColumn[category], true);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as PushSubscriptionRow[], payload);
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length || !isPushConfigured()) return { sent: 0, failed: 0 };
  const { data, error } = await getServiceClient().from("push_subscriptions").select("id,endpoint,p256dh,auth_key").in("user_id", uniqueUserIds);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as PushSubscriptionRow[], payload);
}
