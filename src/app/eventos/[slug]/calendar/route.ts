import { createClient } from "@/lib/supabase/server";

function escapeIcs(value: string) { return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }
function icsDate(iso: string) { return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id,name,description,starts_at,ends_at,location").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!event) return new Response("Evento no encontrado", { status: 404 });
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Soy Templo//Agenda//ES","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${event.id}@soy-templo`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${icsDate(event.starts_at)}`, event.ends_at ? `DTEND:${icsDate(event.ends_at)}` : "", `SUMMARY:${escapeIcs(event.name)}`, event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "", event.location ? `LOCATION:${escapeIcs(event.location)}` : "", "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
  return new Response(lines, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.ics"`, "Cache-Control": "public, max-age=300" } });
}
