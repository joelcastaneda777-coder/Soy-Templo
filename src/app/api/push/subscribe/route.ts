import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const preferencesSchema = z.object({
  notify_devotional: z.boolean().optional(),
  notify_verse: z.boolean().optional(),
  notify_events: z.boolean().optional(),
  notify_sermons: z.boolean().optional(),
  notify_campaigns: z.boolean().optional(),
  notify_prayer: z.boolean().optional(),
});

const bodySchema = z.object({
  endpoint: z.string().url().max(4000),
  keys: z.object({ p256dh: z.string().min(1).max(1000), auth: z.string().min(1).max(1000) }),
  preferences: preferencesSchema.optional(),
  deviceName: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para activar notificaciones." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "El servicio de notificaciones no está disponible." }, { status: 503 });

  const service = createServiceClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: readError } = await service
    .from("push_subscriptions")
    .select("id,user_id,p256dh,auth_key")
    .eq("endpoint", parsed.data.endpoint)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: "No se pudo comprobar este dispositivo." }, { status: 500 });

  if (existing && existing.user_id !== user.id && (existing.p256dh !== parsed.data.keys.p256dh || existing.auth_key !== parsed.data.keys.auth)) {
    return NextResponse.json({ error: "Esta suscripción pertenece a otro dispositivo. Vuelve a activar las notificaciones." }, { status: 409 });
  }

  const row = {
    user_id: user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth_key: parsed.data.keys.auth,
    device_name: parsed.data.deviceName || null,
    last_seen_at: new Date().toISOString(),
    ...(parsed.data.preferences ?? {}),
  };

  const { error } = await service.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
