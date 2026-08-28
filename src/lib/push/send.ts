import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type PushCategory = "devotional" | "verse" | "events" | "sermons" | "campaigns" | "prayer";
const categoryColumn: Record<PushCategory, string> = { devotional: "notify_devotional", verse: "notify_verse", events: "notify_events", sermons: "notify_sermons", campaigns: "notify_campaigns", prayer: "notify_prayer" };

type PushConfig = { publicKey: string; privateKey: string };
let cachedVaultConfig: PushConfig | null | undefined;
let cachedAt = 0;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getPushConfig(): Promise<PushConfig | null> {
  const envPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  if (envPublic && envPrivate) return { publicKey: envPublic, privateKey: envPrivate };

  if (cachedVaultConfig !== undefined && Date.now() - cachedAt < 5 * 60 * 1000) return cachedVaultConfig;
  const service = getServiceClient();
  if (!service) return null;

  const { data, error } = await service.rpc("get_push_vapid_config").maybeSingle();
  if (error || !data?.public_key || !data?.private_key) {
    cachedVaultConfig = null;
  } else {
    cachedVaultConfig = { publicKey: data.public_key as string, privateKey: data.private_key as string };
  }
  cachedAt = Date.now();
  return cachedVaultConfig;
}

export async function isPushConfigured() { return Boolean(await getPushConfig()); }

export type PushPayload = { title: string; body: string; url?: string; tag?: string };
type PushSubscriptionRow = { id: string; endpoint: string; p256dh: string; auth_key: string };

async function deliver(subscriptions: PushSubscriptionRow[], payload: PushPayload, config: PushConfig): Promise<{ sent: number; failed: number }> {
  webpush.setVapidDetails("mailto:hola@soytemplo.org", config.publicKey, config.privateKey);
  const service = getServiceClient();
  if (!service) return { sent: 0, failed: subscriptions.length };
  let sent = 0; let failed = 0; const expiredIds: string[] = [];
  await Promise.all(subscriptions.map(async (sub) => {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, JSON.stringify(payload)); sent++; }
    catch (err: unknown) { failed++; const statusCode = (err as { statusCode?: number })?.statusCode; if (statusCode === 404 || statusCode === 410) expiredIds.push(sub.id); }
  }));
  if (expiredIds.length) await service.from("push_subscriptions").delete().in("id", expiredIds);
  return { sent, failed };
}

export async function sendPushToCategory(category: PushCategory, payload: PushPayload) {
  const config = await getPushConfig(); const service = getServiceClient();
  if (!config || !service) return { sent: 0, failed: 0 };
  const { data, error } = await service.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq(categoryColumn[category], true);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as PushSubscriptionRow[], payload, config);
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const config = await getPushConfig(); const service = getServiceClient();
  if (!uniqueUserIds.length || !config || !service) return { sent: 0, failed: 0 };
  const { data, error } = await service.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").in("user_id", uniqueUserIds);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as PushSubscriptionRow[], payload, config);
}
