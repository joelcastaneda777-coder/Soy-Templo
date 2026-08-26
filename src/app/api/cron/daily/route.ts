import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToCategory } from "@/lib/push/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
 * Corre una vez al día (configurado en vercel.json).
 * 1) Publica el push del devocional + versículo del día, si no se ha enviado.
 * 2) Envía recordatorios de "1 día antes" para eventos que empiezan
 *    entre 20 y 32 horas a partir de ahora (una ventana amplia porque
 *    este cron solo corre una vez al día).
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const results: Record<string, unknown> = {};

  // --- 1) Devocional + versículo del día ---
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const { data: devotional } = await supabase
    .from("devotionals")
    .select("id, slug, title, key_verse")
    .eq("status", "published")
    .is("pushed_at", null)
    .gte("publish_at", startOfDay.toISOString())
    .lt("publish_at", endOfDay.toISOString())
    .order("publish_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (devotional) {
    const url = `/devocionales/${devotional.slug}`;
    const [devotionalPush, versePush] = await Promise.all([
      sendPushToCategory("devotional", {
        title: "Nuevo devocional disponible",
        body: devotional.title,
        url,
        tag: "devotional",
      }),
      sendPushToCategory("verse", {
        title: "Versículo del día",
        body: devotional.key_verse,
        url,
        tag: "verse",
      }),
    ]);
    await supabase.from("devotionals").update({ pushed_at: now.toISOString() }).eq("id", devotional.id);
    results.devotional = { devotionalPush, versePush, title: devotional.title };
  } else {
    results.devotional = "sin devocional pendiente hoy";
  }

  // --- 2) Recordatorio "1 día antes" ---
  const dayBeforeStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const dayBeforeEnd = new Date(now.getTime() + 32 * 60 * 60 * 1000);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, slug, name, starts_at, location")
    .eq("status", "published")
    .gte("starts_at", dayBeforeStart.toISOString())
    .lte("starts_at", dayBeforeEnd.toISOString());

  let dayBeforeSent = 0;
  for (const event of upcomingEvents ?? []) {
    const { data: alreadySent } = await supabase
      .from("event_reminders_sent")
      .select("event_id")
      .eq("event_id", event.id)
      .eq("kind", "day_before")
      .maybeSingle();
    if (alreadySent) continue;

    await sendPushToCategory("events", {
      title: `Mañana: ${event.name}`,
      body: event.location ? `Te esperamos en ${event.location}` : "No te lo pierdas.",
      url: "/eventos",
      tag: `event-day-before-${event.id}`,
    });
    await supabase.from("event_reminders_sent").insert({ event_id: event.id, kind: "day_before" });
    dayBeforeSent++;
  }
  results.dayBeforeReminders = dayBeforeSent;

  return NextResponse.json({ ok: true, results });
}
