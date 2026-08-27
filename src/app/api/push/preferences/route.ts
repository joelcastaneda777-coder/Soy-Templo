import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  endpoint: z.string().url(),
  notify_devotional: z.boolean(),
  notify_verse: z.boolean(),
  notify_events: z.boolean(),
  notify_sermons: z.boolean(),
  notify_campaigns: z.boolean(),
  notify_prayer: z.boolean(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ error: "Endpoint requerido." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("notify_devotional, notify_verse, notify_events, notify_sermons, notify_campaigns, notify_prayer")
    .eq("endpoint", endpoint)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "No se pudieron cargar las preferencias." }, { status: 500 });
  return NextResponse.json({ preferences: data });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const { endpoint, ...preferences } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { error } = await supabase
    .from("push_subscriptions")
    .update(preferences)
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "No se pudieron guardar las preferencias." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
