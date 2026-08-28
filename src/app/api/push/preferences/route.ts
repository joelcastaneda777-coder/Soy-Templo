import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const endpointSchema = z.string().url().max(4000);
const bodySchema = z.object({
  endpoint: endpointSchema,
  notify_devotional: z.boolean(),
  notify_verse: z.boolean(),
  notify_events: z.boolean(),
  notify_sermons: z.boolean(),
  notify_campaigns: z.boolean(),
  notify_prayer: z.boolean(),
});

export async function GET(request: Request) {
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const parsedEndpoint = endpointSchema.safeParse(endpoint);
  if (!parsedEndpoint.success) return NextResponse.json({ error: "Endpoint inválido." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("notify_devotional,notify_verse,notify_events,notify_sermons,notify_campaigns,notify_prayer")
    .eq("endpoint", parsedEndpoint.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudieron cargar las preferencias." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Este dispositivo aún no está vinculado a tu cuenta." }, { status: 404 });
  return NextResponse.json({ preferences: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const { endpoint, ...preferences } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data, error } = await supabase
    .from("push_subscriptions")
    .update({ ...preferences, last_seen_at: new Date().toISOString() })
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudieron guardar las preferencias." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Este dispositivo no pertenece a tu cuenta." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
