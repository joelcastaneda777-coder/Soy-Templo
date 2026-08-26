import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  preferences: z
    .object({
      notify_devotional: z.boolean().optional(),
      notify_verse: z.boolean().optional(),
      notify_events: z.boolean().optional(),
      notify_sermons: z.boolean().optional(),
      notify_campaigns: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de suscripción inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user?.id ?? null,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth_key: parsed.data.keys.auth,
      ...(parsed.data.preferences ?? {}),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar la suscripción." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
