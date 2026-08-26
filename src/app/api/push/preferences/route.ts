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
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { endpoint, ...preferences } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .update(preferences)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: "No se pudieron guardar las preferencias." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
