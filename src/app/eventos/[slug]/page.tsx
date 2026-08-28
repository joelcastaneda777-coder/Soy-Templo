import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/events/calendar";
import { RegistrationPanel } from "./registration-panel";

export const dynamic = "force-dynamic";

function one<T>(value: T | T[] | null | undefined): T | null { return Array.isArray(value) ? value[0] ?? null : value ?? null; }

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("events")
    .select("id,slug,name,description,starts_at,ends_at,location,map_url,image_url,stream_url,contact_info,capacity,registered_count,attendance_mode,registration_deadline,is_featured,category:event_categories(slug,name,color_hex),ministry:ministries(name)")
    .eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const event = await getEvent(slug); if (!event) return {};
  return { title: event.name, description: event.description ?? `Actividad de Soy Templo: ${event.name}` };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const event = await getEvent(slug); if (!event) notFound();
  const category = one(event.category as { name: string; color_hex: string } | { name: string; color_hex: string }[] | null);
  const ministry = one(event.ministry as { name: string } | { name: string }[] | null);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let registration: { id: string; party_size: number } | null = null;
  if (user) {
    const { data } = await supabase.from("event_registrations").select("id,party_size").eq("event_id", event.id).eq("user_id", user.id).eq("status", "active").maybeSingle();
    registration = data;
  }
  const future = new Date(event.starts_at) > new Date();
  const mode = event.attendance_mode === "rsvp" || event.attendance_mode === "registration" ? event.attendance_mode : "none";

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href="/eventos" className="text-sm font-semibold text-anil-600">← Volver a la agenda</Link>
      {event.image_url ? <img src={event.image_url} alt="" className="max-h-80 w-full rounded-[var(--radius-card)] object-cover" /> : null}
      <header>
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full px-3 py-1 text-white" style={{ backgroundColor: category?.color_hex ?? "#5B5FEF" }}>{category?.name ?? "General"}</span>{ministry ? <span className="rounded-full bg-manta px-3 py-1">{ministry.name}</span> : null}{event.is_featured ? <span>★ Destacado</span> : null}</div>
        <h1 className="font-display text-3xl font-semibold text-anil-800">{event.name}</h1>
        <p className="mt-2 text-lg font-semibold capitalize">{formatEventDate(event.starts_at)}</p>
        <p className="text-tinta-suave">{formatEventTime(event.starts_at)}{event.ends_at ? ` – ${formatEventTime(event.ends_at)}` : ""}</p>
      </header>
      {event.description ? <p className="whitespace-pre-line leading-relaxed">{event.description}</p> : null}
      <section className="grid gap-3 sm:grid-cols-2">
        {event.location ? <div className="rounded-[var(--radius-card)] border border-manta p-4"><p className="text-xs font-semibold uppercase text-tinta-suave">Ubicación</p><p className="mt-1 font-semibold">{event.location}</p>{event.map_url ? <a href={event.map_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-anil-600">Cómo llegar →</a> : null}</div> : null}
        <div className="rounded-[var(--radius-card)] border border-manta p-4"><p className="text-xs font-semibold uppercase text-tinta-suave">Calendario</p><a href={`/eventos/${event.slug}/calendar`} className="mt-1 inline-block font-semibold text-anil-600">Agregar a mi calendario ↓</a></div>
      </section>
      {event.stream_url ? <a href={event.stream_url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-anil-700 px-4 py-2 font-semibold text-white">Ver transmisión →</a> : null}
      {event.contact_info ? <p className="text-sm text-tinta-suave">Contacto: {event.contact_info}</p> : null}
      {future && mode !== "none" ? <RegistrationPanel eventId={event.id} slug={event.slug} mode={mode} capacity={event.capacity} registeredCount={event.registered_count ?? 0} initial={registration} /> : null}
    </article>
  );
}
