import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToCategory } from "@/lib/push/send";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

/**
 * Pensado para llamarse cada 30 minutos (GitHub Actions, ver
 * .github/workflows/event-four-hour-reminders.yml — Vercel Cron gratuito
 * solo permite una vez al día, y este recordatorio necesita más precisión).
 * Ventana de 3h45m a 4h15m para no perder eventos por el margen de 30 min
 * entre cada revisión.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = Date.now();
  const windowStart = new Date(now + 3.75 * 60 * 60 * 1000);
  const windowEnd = new Date(now + 4.25 * 60 * 60 * 1000);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, name, starts_at, location")
    .eq("status", "published")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  let sent = 0;
  for (const event of upcomingEvents ?? []) {
    const { data: alreadySent } = await supabase
      .from("event_reminders_sent")
      .select("event_id")
      .eq("event_id", event.id)
      .eq("kind", "four_hours")
      .maybeSingle();
    if (alreadySent) continue;

    await sendPushToCategory("events", {
      title: `En 4 horas: ${event.name}`,
      body: event.location ? `Nos vemos en ${event.location}` : "¡Ya casi es hora!",
      url: "/eventos",
      tag: `event-four-hours-${event.id}`,
    });
    await supabase.from("event_reminders_sent").insert({ event_id: event.id, kind: "four_hours" });
    sent++;
  }

  return NextResponse.json({ ok: true, sent, checked: upcomingEvents?.length ?? 0 });
}
