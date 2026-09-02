import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createRadioProgram, createRadioSchedule, deleteRadioSchedule, saveRadioStation } from "./actions";
import { NewEpisodeForm } from "./new-episode-form";

export const metadata: Metadata = { title: "Radio · Panel" };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function AdminRadioPage() {
  const supabase = await createClient();
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">No tienes permiso para administrar Radio.</p>;

  const [{ data: programs }, { data: episodes }, { data: schedules }, { data: settings }] = await Promise.all([
    supabase.from("radio_programs").select("id,name,host_name,schedule_text,status,category,is_featured,accent_color").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("radio_episodes").select("id,program_id,title,access_tier,status,published_at,duration_seconds").is("deleted_at", null).order("created_at", { ascending: false }).limit(40),
    supabase.from("radio_schedule").select("id,program_id,day_of_week,start_time,end_time,label,is_live,is_active").order("day_of_week").order("start_time"),
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
  ]);
  const programMap = new Map((programs ?? []).map((program) => [program.id, program.name]));
  const radio = (settings?.value as { name?: string; description?: string; stream_url?: string | null } | null) ?? {};

  return (
    <div className="max-w-6xl space-y-8">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-anil-500">Audio</p><h1 className="mt-1 font-display text-3xl font-semibold text-anil-900">Radio Soy Templo</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-tinta-suave">Gestiona la señal 24/7, los programas, la parrilla horaria y el archivo bajo demanda desde un solo lugar.</p></div>

      <section className="rounded-[var(--radius-card)] border border-manta bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="font-display text-xl font-semibold text-anil-800">Estación 24/7</h2><p className="mt-1 text-xs text-tinta-suave">Aquí conectaremos ZenoFM o el proveedor de streaming. El resto de la experiencia permanece independiente.</p></div>
        <form action={saveRadioStation} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-medium">Nombre de la estación<input name="name" defaultValue={radio.name || "Soy Templo Radio"} required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">URL HTTPS del stream<input name="streamUrl" type="url" defaultValue={radio.stream_url || ""} placeholder="https://..." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium md:col-span-2">Descripción<textarea name="description" defaultValue={radio.description || ""} rows={2} className="mt-1 w-full rounded-xl border border-manta p-3" /></label>
          <div className="md:col-span-2"><button className="min-h-11 rounded-full bg-anil-600 px-5 text-sm font-semibold text-white">Guardar estación</button></div>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <form action={createRadioProgram} className="space-y-3 rounded-[var(--radius-card)] border border-manta bg-white p-5 shadow-sm">
          <div><h2 className="font-display text-xl font-semibold text-anil-800">Nuevo programa</h2><p className="mt-1 text-xs text-tinta-suave">Crea la identidad del show que luego puedes colocar en la parrilla.</p></div>
          <label className="block text-sm font-medium">Nombre<input name="name" required maxLength={140} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Descripción<textarea name="description" maxLength={1200} rows={3} className="mt-1 w-full rounded-xl border border-manta p-3" /></label>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Locutor / anfitrión<input name="hostName" maxLength={120} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label><label className="text-sm font-medium">Categoría<input name="category" maxLength={80} placeholder="Conversación, Sermón..." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label></div>
          <label className="block text-sm font-medium">Horario visible<input name="scheduleText" maxLength={240} placeholder="Ej. Lun–Vie · 8:00–10:00 a. m." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Portada (URL)<input name="coverUrl" type="url" placeholder="https://..." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-medium">Color<input name="accentColor" type="color" defaultValue="#5B5FEF" className="mt-1 h-11 w-full rounded-xl border border-manta p-1" /></label><label className="text-sm font-medium">Estado<select name="status" defaultValue="draft" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="draft">Borrador</option><option value="published">Publicado</option></select></label><label className="flex items-end gap-2 pb-2 text-sm font-medium"><input name="featured" type="checkbox" /> Destacado</label></div>
          <button className="min-h-11 rounded-full bg-anil-600 px-5 font-semibold text-white">Crear programa</button>
        </form>

        <NewEpisodeForm programs={(programs ?? []).map((program) => ({ id: program.id, name: program.name }))} />
      </section>

      <section className="rounded-[var(--radius-card)] border border-manta bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="font-display text-xl font-semibold text-anil-800">Parrilla de programación</h2><p className="mt-1 text-xs text-tinta-suave">La app usará estas franjas para mostrar automáticamente qué programa está al aire y cuál sigue.</p></div>
        <form action={createRadioSchedule} className="grid gap-3 md:grid-cols-6">
          <label className="text-sm font-medium md:col-span-2">Programa<select name="programId" required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="">Seleccionar…</option>{(programs ?? []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
          <label className="text-sm font-medium">Día<select name="dayOfWeek" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3">{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
          <label className="text-sm font-medium">Inicio<input name="startTime" type="time" required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="text-sm font-medium">Fin<input name="endTime" type="time" required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium"><input name="isLive" type="checkbox" /> En vivo</label>
          <label className="text-sm font-medium md:col-span-5">Etiqueta opcional<input name="label" maxLength={120} placeholder="Especial con invitados" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <div className="flex items-end"><button disabled={!programs?.length} className="min-h-11 rounded-full bg-anil-600 px-5 text-sm font-semibold text-white disabled:opacity-50">Agregar horario</button></div>
        </form>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{schedules?.length ? schedules.map((slot) => <div key={slot.id} className="rounded-2xl border border-manta p-4 text-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-anil-500">{DAYS[slot.day_of_week]}</p><p className="mt-1 font-semibold text-anil-900">{programMap.get(slot.program_id) || "Programa"}</p><p className="text-xs text-tinta-suave">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)} {slot.is_live ? "· EN VIVO" : ""}</p>{slot.label ? <p className="mt-1 text-xs text-tinta-suave">{slot.label}</p> : null}</div><form action={deleteRadioSchedule}><input type="hidden" name="id" value={slot.id} /><button className="text-xs font-semibold text-error">Quitar</button></form></div></div>) : <p className="text-sm text-tinta-suave">Todavía no hay horarios configurados.</p>}</div>
      </section>

      <section className="space-y-3"><h2 className="font-display text-xl font-semibold text-anil-800">Episodios recientes</h2>{episodes?.length ? <ul className="grid gap-2 md:grid-cols-2">{episodes.map((episode) => <li key={episode.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-manta bg-white p-4 text-sm"><div><strong>{episode.title}</strong><p className="text-xs text-tinta-suave">{programMap.get(episode.program_id) || "Programa"}{episode.duration_seconds ? ` · ${Math.round(episode.duration_seconds/60)} min` : ""}</p></div><div className="flex gap-2"><span className="rounded-full bg-anil-50 px-3 py-1 text-xs font-semibold">{episode.access_tier === "plus" ? "Soy Templo+" : "Gratis"}</span><span className="rounded-full border border-manta px-3 py-1 text-xs">{episode.status}</span></div></li>)}</ul> : <p className="text-sm text-tinta-suave">Todavía no hay episodios archivados.</p>}</section>
    </div>
  );
}
