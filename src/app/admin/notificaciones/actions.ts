"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isPushConfigured, sendPushToCategory, sendPushToUsers } from "@/lib/push/send";
import { sleep } from "@/lib/utils";

async function requireNotificationAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((row) => row.role === "admin" || row.role === "superadmin")) throw new Error("Sin permiso");
  return { user };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const schema = z.object({ title: z.string().trim().min(3).max(80), body: z.string().trim().min(5).max(200), categorySlug: z.string().trim().optional() });
export type CampaignPushState = { ok?: boolean; sent?: number; error?: string };

export async function sendCampaignPush(_prev: CampaignPushState, formData: FormData): Promise<CampaignPushState> {
  const parsed = schema.safeParse({ title: formData.get("title"), body: formData.get("body"), categorySlug: formData.get("categorySlug") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  try { await requireNotificationAdmin(); } catch { return { error: "Solo administradores pueden enviar notificaciones masivas." }; }
  if (!isPushConfigured()) return { error: "El push web todavía no está configurado en producción." };
  const url = parsed.data.categorySlug ? `/donar?categoria=${parsed.data.categorySlug}` : "/donar";
  const { sent } = await sendPushToCategory("campaigns", { title: parsed.data.title, body: parsed.data.body, url, tag: "campaign" });
  await sleep(300); return { ok: true, sent };
}

export type TestPushState = { ok?: boolean; sent?: number; failed?: number; devices?: number; fallback?: boolean; message?: string; error?: string };
export async function sendTestPush(): Promise<TestPushState> {
  let user: { id: string };
  try { ({ user } = await requireNotificationAdmin()); } catch { return { error: "Sin permiso." }; }
  const service = serviceClient();
  if (!service) return { error: "Falta la configuración segura de Supabase en el servidor." };

  const { count } = await service.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const devices = count ?? 0;
  const title = "Prueba de notificaciones · Soy Templo";
  const body = "Si ves este aviso, este dispositivo ya recibe notificaciones correctamente.";
  const { error: fallbackError } = await service.from("user_notifications").insert({ user_id: user.id, kind: "system", title, body: "Prueba guardada correctamente en el centro interno de notificaciones.", url: "/notificaciones" });
  const fallback = !fallbackError;
  revalidatePath("/notificaciones"); revalidatePath("/mas"); revalidatePath("/admin/notificaciones");

  if (!isPushConfigured()) return { devices, fallback, error: "El centro interno funciona, pero faltan las claves VAPID para enviar al teléfono." };
  if (!devices) return { devices: 0, fallback, error: "El centro interno funciona. Activa primero las notificaciones en este dispositivo desde Más." };

  const { sent, failed } = await sendPushToUsers([user.id], { title, body, url: "/notificaciones", tag: "soy-templo-push-test" });
  return sent > 0 ? { ok: true, sent, failed, devices, fallback, message: "Prueba enviada. Deberías verla en tus dispositivos vinculados." } : { sent, failed, devices, fallback, error: "Había dispositivos registrados, pero ninguno confirmó el envío. Revisa el permiso del navegador." };
}
