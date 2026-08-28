import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/events/calendar";
import { EventForm } from "./event-form";
import { cancelEvent } from "./actions";

export const metadata: Metadata={ title:"Eventos · Panel" };
function one<T>(value:T|T[]|null|undefined):T|null { return Array.isArray(value)?value[0]??null:value??null; }

export default async function AdminEventsPage() {
  const supabase=await createClient(); const since=new Date(Date.now()-7*86400000).toISOString();
  const [{data:categories},{data:ministries},{data:events}]=await Promise.all([
    supabase.from("event_categories").select("id,name,color_hex").eq("active",true).order("sort_order"),
    supabase.from("ministries").select("id,name").is("deleted_at",null).order("name"),
    supabase.from("events").select("id,slug,name,starts_at,status,attendance_mode,capacity,registered_count,recurrence_group_id,recurrence_kind,is_featured,category:event_categories(name,color_hex),ministry:ministries(name)").is("deleted_at",null).gte("starts_at",since).order("starts_at").limit(120),
  ]);
  return <div className="max-w-4xl space-y-7"><div><h1 className="font-display text-2xl font-semibold text-anil-800">Eventos y agenda</h1><p className="mt-1 text-sm text-tinta-suave">Crea actividades únicas o recurrentes. Cada ocurrencia aparece en el calendario y recibe sus propios recordatorios.</p></div>
    <EventForm categories={(categories??[]).map(c=>({id:c.id,name:c.name,colorHex:c.color_hex}))} ministries={(ministries??[]).map(m=>({id:m.id,name:m.name}))} />
    <section><h2 className="mb-3 font-display text-xl font-semibold">Actividades programadas</h2><div className="space-y-3">{(events??[]).map((event)=>{const category=one(event.category as {name:string;color_hex:string}|{name:string;color_hex:string}[]|null); const ministry=one(event.ministry as {name:string}|{name:string}[]|null); return <article key={event.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold" style={{color:category?.color_hex??"#5B5FEF"}}>{category?.name??"General"}{ministry?` · ${ministry.name}`:""}</p><h3 className="font-display text-lg font-semibold">{event.name}</h3><p className="text-sm text-tinta-suave capitalize">{formatEventDate(event.starts_at)} · {formatEventTime(event.starts_at)}</p><p className="mt-1 text-xs text-tinta-suave">{event.status}{event.recurrence_group_id?` · serie ${event.recurrence_kind}`:""}{event.attendance_mode!=="none"?` · ${event.registered_count??0}${event.capacity?`/${event.capacity}`:""} confirmados`:""}</p></div><div className="flex flex-wrap gap-2"><Link href={`/eventos/${event.slug}`} className="rounded-xl border border-manta px-3 py-2 text-xs font-semibold">Ver</Link><Link href={`/admin/eventos/${event.id}/editar`} className="rounded-xl border border-manta px-3 py-2 text-xs font-semibold">Editar</Link>{event.status!=="cancelled"?<form action={cancelEvent}><input type="hidden" name="id" value={event.id}/><input type="hidden" name="scope" value="one"/><button className="rounded-xl border border-manta px-3 py-2 text-xs font-semibold">Cancelar</button></form>:null}{event.recurrence_group_id&&event.status!=="cancelled"?<form action={cancelEvent}><input type="hidden" name="id" value={event.id}/><input type="hidden" name="scope" value="series"/><button className="rounded-xl border border-manta px-3 py-2 text-xs font-semibold">Cancelar esta y futuras</button></form>:null}</div></div></article>})}</div></section>
  </div>;
}
