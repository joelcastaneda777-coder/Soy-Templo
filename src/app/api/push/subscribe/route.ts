import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const preferencesSchema = z.object({
  notify_devotional: z.boolean().optional(),
  notify_verse: z.boolean().optional(),
  notify_events: z.boolean().optional(),
  notify_sermons: z.boolean().optional(),
  notify_campaigns: z.boolean().optional(),
  notify_prayer: z.boolean().optional(),
  notify_announcements: z.boolean().optional(),
});

const bodySchema = z.object({
  endpoint: z.string().url().max(4000),
  keys: z.object({ p256dh: z.string().min(1).max(1000), auth: z.string().min(1).max(1000) }),
  preferences: preferencesSchema.optional(),
  deviceName: z.string().trim().max(80).optional(),
});

type GatewayResult = { ok?: boolean; error?: string };

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });

  const supabase = await createClient();
  const [{ data: { user } }, { data: { session } }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
  if (!user || !session?.access_token) return NextResponse.json({ error: "Inicia sesión para activar notificaciones." }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return NextResponse.json({ error: "El servicio de notificaciones no está disponible." }, { status: 503 });

  const response = await fetch(`${base}/functions/v1/push-gateway`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({
      action: "claim_subscription",
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      authKey: parsed.data.keys.auth,
      deviceName: parsed.data.deviceName || null,
      preferences: parsed.data.preferences ?? {},
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as GatewayResult;
  if (!response.ok) {
    if (response.status === 409) return NextResponse.json({ error: "Esta suscripción cambió sus claves. Desactiva y vuelve a activar las notificaciones en este dispositivo." }, { status: 409 });
    return NextResponse.json({ error: data.error || "No se pudo vincular este dispositivo." }, { status: response.status >= 500 ? 503 : response.status });
  }

  return NextResponse.json({ ok: true });
}
