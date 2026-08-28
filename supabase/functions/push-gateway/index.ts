import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const categoryColumns: Record<string, string> = {
  devotional: "notify_devotional",
  verse: "notify_verse",
  events: "notify_events",
  sermons: "notify_sermons",
  campaigns: "notify_campaigns",
  prayer: "notify_prayer",
  announcements: "notify_announcements",
};
const preferenceKeys = ["notify_devotional","notify_verse","notify_events","notify_sermons","notify_campaigns","notify_prayer","notify_announcements"] as const;

type Payload = { title: string; body: string; url?: string; tag?: string };
type Subscription = { id: string; endpoint: string; p256dh: string; auth_key: string };
type CareRow = { user_id: string; is_supervisor: boolean; can_triage: boolean; can_prayer_followup: boolean; can_counseling: boolean; can_hospital_visit: boolean; can_home_visit: boolean; lead_prayer: boolean; lead_counseling: boolean; lead_hospital_visit: boolean; lead_home_visit: boolean; notify_new_requests: boolean; notify_urgent: boolean };

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }); }
function sanitizePreferences(input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const out: Record<string, boolean> = {};
  for (const key of preferenceKeys) if (typeof source[key] === "boolean") out[key] = source[key] as boolean;
  return out;
}
function validUrl(value: string) { try { const url = new URL(value); return url.protocol === "https:"; } catch { return false; } }

async function getVapid() {
  const { data, error } = await service.rpc("get_push_vapid_config").maybeSingle();
  const row = data as { public_key?: string; private_key?: string } | null;
  if (error || !row?.public_key || !row.private_key) return null;
  return { publicKey: row.public_key, privateKey: row.private_key };
}
async function getGatewaySecret() { const { data, error } = await service.rpc("get_push_gateway_secret"); return error || typeof data !== "string" ? null : data; }
async function authenticatedUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const { data: { user }, error } = await service.auth.getUser(auth.slice(7));
  return error ? null : user;
}
async function isAdmin(userId: string) {
  const { data } = await service.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "superadmin"]).limit(1);
  return Boolean(data?.length);
}

async function deliver(subscriptions: Subscription[], payload: Payload) {
  const config = await getVapid();
  if (!config) return { sent: 0, failed: subscriptions.length, error: "push_not_configured" };
  webpush.setVapidDetails("mailto:hola@soytemplo.org", config.publicKey, config.privateKey);
  let sent = 0; let failed = 0; const expired: string[] = [];
  await Promise.all(subscriptions.map(async (sub) => {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, JSON.stringify(payload)); sent++; }
    catch (error: unknown) { failed++; const code = (error as { statusCode?: number })?.statusCode; if (code === 404 || code === 410) expired.push(sub.id); }
  }));
  if (expired.length) await service.from("push_subscriptions").delete().in("id", expired);
  return { sent, failed };
}
async function sendUsers(userIds: string[], payload: Payload) {
  const ids = [...new Set(userIds.filter(Boolean))]; if (!ids.length) return { sent: 0, failed: 0 };
  const { data, error } = await service.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").in("user_id", ids);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as Subscription[], payload);
}
async function sendCategory(category: string, payload: Payload) {
  const column = categoryColumns[category]; if (!column) return { sent: 0, failed: 0, error: "invalid_category" };
  const { data, error } = await service.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq(column, true);
  if (error || !data?.length) return { sent: 0, failed: 0 };
  return deliver(data as Subscription[], payload);
}
async function adminIds() { const { data } = await service.from("user_roles").select("user_id").in("role", ["admin", "superadmin"]); return [...new Set((data ?? []).map((row) => row.user_id as string))]; }
function handlesCareType(row: CareRow, type: string) {
  if (row.is_supervisor || row.can_triage) return true;
  if (type === "prayer") return row.lead_prayer || row.can_prayer_followup;
  if (type === "counseling") return row.lead_counseling || row.can_counseling;
  if (type === "hospital_visit") return row.lead_hospital_visit || row.can_hospital_visit;
  if (type === "home_visit") return row.lead_home_visit || row.can_home_visit;
  return false;
}
async function careRecipients(type: string, urgent: boolean) {
  const { data: team } = await service.from("care_team_members").select("user_id,is_supervisor,can_triage,can_prayer_followup,can_counseling,can_hospital_visit,can_home_visit,lead_prayer,lead_counseling,lead_hospital_visit,lead_home_visit,notify_new_requests,notify_urgent").eq("active", true);
  const recipients = ((team ?? []) as CareRow[]).filter((row) => handlesCareType(row, type) && (row.is_supervisor || row.notify_new_requests || (urgent && row.notify_urgent))).map((row) => row.user_id);
  return recipients.length ? [...new Set(recipients)] : await adminIds();
}
async function writeInternal(userIds: string[], kind: string, title: string, body: string, url: string, careRequestId?: string) {
  const rows = [...new Set(userIds)].map((user_id) => ({ user_id, kind, title, body, url, related_care_request_id: careRequestId ?? null }));
  if (rows.length) await service.from("user_notifications").insert(rows);
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const config = await getVapid();
    return config ? json({ configured: true, publicKey: config.publicKey }) : json({ configured: false, publicKey: null }, 503);
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return json({ error: "invalid_request" }, 400);
  const gatewaySecret = await getGatewaySecret();
  const internal = Boolean(gatewaySecret && req.headers.get("x-soy-templo-gateway") === gatewaySecret);
  const user = internal ? null : await authenticatedUser(req);
  if (!internal && !user) return json({ error: "unauthorized" }, 401);

  if (user && body.action === "claim_subscription") {
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    const p256dh = typeof body.p256dh === "string" ? body.p256dh : "";
    const authKey = typeof body.authKey === "string" ? body.authKey : "";
    const deviceName = typeof body.deviceName === "string" ? body.deviceName.trim().slice(0, 80) : null;
    if (!validUrl(endpoint) || endpoint.length > 4000 || !p256dh || p256dh.length > 1000 || !authKey || authKey.length > 1000) return json({ error: "invalid_subscription" }, 400);
    const { data: existing, error: readError } = await service.from("push_subscriptions").select("id,user_id,p256dh,auth_key").eq("endpoint", endpoint).maybeSingle();
    if (readError) return json({ error: "subscription_lookup_failed" }, 500);
    if (existing && existing.user_id !== user.id && (existing.p256dh !== p256dh || existing.auth_key !== authKey)) return json({ error: "subscription_conflict" }, 409);
    const row = { user_id: user.id, endpoint, p256dh, auth_key: authKey, device_name: deviceName, last_seen_at: new Date().toISOString(), ...sanitizePreferences(body.preferences) };
    const { error } = await service.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
    return error ? json({ error: "subscription_write_failed" }, 500) : json({ ok: true });
  }

  if (user && body.action === "admin_stats") {
    if (!(await isAdmin(user.id))) return json({ error: "forbidden" }, 403);
    const { data, error } = await service.from("push_subscriptions").select("user_id,device_name,last_seen_at");
    if (error) return json({ error: "stats_failed" }, 500);
    const rows = data ?? []; const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return json({ ok: true, totalDevices: rows.length, usersWithPush: new Set(rows.map((row) => row.user_id)).size, recentDevices: rows.filter((row) => new Date(row.last_seen_at).getTime() >= sevenDaysAgo).length, ownDevices: rows.filter((row) => row.user_id === user.id).map((row) => ({ device_name: row.device_name, last_seen_at: row.last_seen_at })) });
  }

  if (internal && body.action === "care_new") {
    const requestId = typeof body.requestId === "string" ? body.requestId : "";
    const { data: request } = await service.from("care_requests").select("request_type,priority").eq("id", requestId).is("deleted_at", null).maybeSingle();
    if (!request) return json({ error: "request_not_found" }, 404);
    const recipients = await careRecipients(request.request_type, request.priority === "urgent");
    const labels: Record<string, string> = { counseling: "Nueva solicitud de consejería", hospital_visit: "Nueva solicitud de visita hospitalaria", home_visit: "Nueva solicitud para Plantadores" };
    const title = request.priority === "urgent" ? "Soy Templo · Cuidado urgente" : "Soy Templo · Cuidado";
    const text = labels[request.request_type] ?? "Nueva solicitud de cuidado";
    await writeInternal(recipients, request.priority === "urgent" ? "care_urgent" : "care_new", title, text, "/cuidado", requestId);
    const push = await sendUsers(recipients, { title, body: text, url: "/cuidado", tag: `care-${requestId}` });
    return json({ ok: true, recipients: recipients.length, ...push });
  }
  if (internal && body.action === "prayer_new") {
    const prayerId = typeof body.prayerId === "string" ? body.prayerId : "";
    const { data: prayer } = await service.from("prayer_requests").select("id").eq("id", prayerId).is("deleted_at", null).maybeSingle();
    if (!prayer) return json({ error: "prayer_not_found" }, 404);
    const recipients = await careRecipients("prayer", false); const title = "Soy Templo · Cuidado"; const text = "Nueva petición de oración pendiente de revisión";
    await writeInternal(recipients, "care_new", title, text, "/cuidado?tab=oracion");
    const push = await sendUsers(recipients, { title, body: text, url: "/cuidado?tab=oracion", tag: `prayer-review-${prayerId}` });
    return json({ ok: true, recipients: recipients.length, ...push });
  }
  if (internal && body.action === "prayer_published") {
    const prayerId = typeof body.prayerId === "string" ? body.prayerId : "";
    const { data: prayer } = await service.from("prayer_requests").select("is_public,status").eq("id", prayerId).maybeSingle();
    if (!prayer?.is_public || prayer.status !== "approved") return json({ error: "prayer_not_publishable" }, 409);
    return json({ ok: true, ...(await sendCategory("prayer", { title: "Oremos juntos 🙏", body: "Hay una nueva petición pública de oración. Acompañemos a nuestra comunidad.", url: "/oracion", tag: `community-prayer-${prayerId}` })) });
  }
  if (internal && body.action === "care_assignment") {
    const requestId = typeof body.requestId === "string" ? body.requestId : ""; const userId = typeof body.userId === "string" ? body.userId : "";
    const title = "Soy Templo · Nuevo caso asignado"; const text = "Tienes una nueva responsabilidad de cuidado pastoral.";
    await writeInternal([userId], "care_assignment", title, text, "/cuidado", requestId);
    const { data: member } = await service.from("care_team_members").select("notify_assignment").eq("user_id", userId).eq("active", true).maybeSingle();
    if (member?.notify_assignment === false) return json({ ok: true, skippedPush: true, sent: 0, failed: 0 });
    return json({ ok: true, ...(await sendUsers([userId], { title, body: text, url: "/cuidado", tag: `care-assignment-${requestId}-${userId}` })) });
  }
  if (internal && body.action === "category") {
    const category = typeof body.category === "string" ? body.category : ""; const payload = body.payload as Payload | undefined;
    if (!payload?.title || !payload.body) return json({ error: "invalid_payload" }, 400);
    const push = await sendCategory(category, payload); if ("error" in push && push.error) return json({ ok: false, ...push }, 400); return json({ ok: true, ...push });
  }
  if (user && body.action === "self_test") {
    if (!(await isAdmin(user.id))) return json({ error: "forbidden" }, 403);
    const title = "Prueba de notificaciones · Soy Templo"; const text = "Si ves este aviso, este dispositivo ya recibe notificaciones correctamente.";
    await service.from("user_notifications").insert({ user_id: user.id, kind: "system", title, body: "Prueba guardada correctamente en el centro interno de notificaciones.", url: "/notificaciones" });
    const { count } = await service.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    return json({ ok: true, devices: count ?? 0, fallback: true, ...(await sendUsers([user.id], { title, body: text, url: "/notificaciones", tag: "soy-templo-push-test" })) });
  }
  if (user && body.action === "campaign") {
    if (!(await isAdmin(user.id))) return json({ error: "forbidden" }, 403);
    const title = typeof body.title === "string" ? body.title.slice(0, 80) : ""; const text = typeof body.body === "string" ? body.body.slice(0, 200) : ""; const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/donar";
    if (title.length < 3 || text.length < 5) return json({ error: "invalid_payload" }, 400);
    return json({ ok: true, ...(await sendCategory("campaigns", { title, body: text, url, tag: "campaign" })) });
  }
  return json({ error: "forbidden_action" }, 403);
});
