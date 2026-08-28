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

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para activar notificaciones." }, { status: 401 });

  const { data, error } = await supabase.rpc("claim_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth_key: parsed.data.keys.auth,
    p_device_name: parsed.data.deviceName || null,
    p_preferences: parsed.data.preferences ?? {},
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Esta suscripción cambió sus claves. Desactiva y vuelve a activar las notificaciones en este dispositivo." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo vincular este dispositivo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data });
}
