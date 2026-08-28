"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type GatewayResult = { ok?: boolean; sent?: number; failed?: number; devices?: number; fallback?: boolean; error?: string };

async function requireNotificationAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((row) => row.role === "admin" || row.role === "superadmin")) throw new Error("Sin permiso");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sesión no disponible");
  return { user, accessToken: session.access_token };
}

async function callGateway(accessToken: string, payload: Record<string, unknown>): Promise<GatewayResult> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Supabase no está configurado.");
  const response = await fetch(`${base}/functions/v1/push-gateway`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as GatewayResult;
  if (!response.ok) throw new Error(data.error || "El gateway de notificaciones rechazó la solicitud.");
  return data;
}

const schema = z.object({ title: z.string().trim().min(3).max(80), body: z.string().trim().min(5).max(200), categorySlug: z.string().trim().optional() });
export type CampaignPushState = { ok?: boolean; sent?: number; error?: string };

export async function sendCampaignPush(_prev: CampaignPushState, formData: FormData): Promise<CampaignPushState> {
  const parsed = schema.safeParse({ title: formData.get("title"), body: formData.get("body"), categorySlug: formData.get("categorySlug") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  try {
    const { accessToken } = await requireNotificationAdmin();
    const url = parsed.data.categorySlug ? `/donar?categoria=${parsed.data.categorySlug}` : "/donar";
    const result = await callGateway(accessToken, { action: "campaign", title: parsed.data.title, body: parsed.data.body, url });
    return { ok: true, sent: result.sent ?? 0 };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar la notificación." };
  }
}

export type TestPushState = { ok?: boolean; sent?: number; failed?: number; devices?: number; fallback?: boolean; message?: string; error?: string };
export async function sendTestPush(): Promise<TestPushState> {
  try {
    const { accessToken } = await requireNotificationAdmin();
    const result = await callGateway(accessToken, { action: "self_test" });
    revalidatePath("/notificaciones"); revalidatePath("/mas"); revalidatePath("/admin/notificaciones");
    const devices = result.devices ?? 0;
    const sent = result.sent ?? 0;
    const failed = result.failed ?? 0;
    const fallback = Boolean(result.fallback);
    if (!devices) return { devices, sent, failed, fallback, error: "El centro interno funciona. Activa primero las notificaciones en este dispositivo desde Más." };
    if (sent > 0) return { ok: true, sent, failed, devices, fallback, message: "Prueba enviada. Deberías verla en tus dispositivos vinculados." };
    return { sent, failed, devices, fallback, error: "Había dispositivos registrados, pero ninguno confirmó el envío. Revisa el permiso del navegador." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo ejecutar la prueba." };
  }
}
