import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "../../event-form";

export const dynamic="force-dynamic";
export default async function EditEventPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=await createClient();
  const [{data:event},{data:categories},{data:ministries}]=await Promise.all([
    supabase.from("events").select("id,name,description,starts_at,ends_at,location,map_url,image_url,category_id,ministry_id,attendance_mode,capacity,registration_deadline,status,is_featured,notify_on_publish,recurrence_kind").eq("id",id).is("deleted_at",null).maybeSingle(),
    supabase.from("event_categories").select("id,name,color_hex").eq("active",true).order("sort_order"), supabase.from("ministries").select("id,name").is("deleted_at",null).order("name")
  ]); if(!event) notFound();
  return <div className="max-w-3xl space-y-5"><Link href="/admin/eventos" className="text-sm font-semibold text-anil-600">← Volver a eventos</Link><div><h1 className="font-display text-2xl font-semibold">Editar actividad</h1><p className="text-sm text-tinta-suave">Los cambios se aplican solo a esta ocurrencia.</p></div><EventForm categories={(categories??[]).map(c=>({id:c.id,name:c.name,colorHex:c.color_hex}))} ministries={(ministries??[]).map(m=>({id:m.id,name:m.name}))} initial={{id:event.id,name:event.name,description:event.description,startsAt:event.starts_at,endsAt:event.ends_at,location:event.location,mapUrl:event.map_url,imageUrl:event.image_url,categoryId:event.category_id,ministryId:event.ministry_id,attendanceMode:event.attendance_mode??"none",capacity:event.capacity,registrationDeadline:event.registration_deadline,status:event.status,isFeatured:event.is_featured??false,notifyOnPublish:event.notify_on_publish??true,recurrenceKind:event.recurrence_kind??"single"}}/></div>;
}
