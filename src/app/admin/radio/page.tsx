import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createRadioEpisode, createRadioProgram } from "./actions";

export const metadata: Metadata = { title: "Radio · Panel" };

export default async function AdminRadioPage() {
  const supabase = await createClient();
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">No tienes permiso para administrar Radio.</p>;

  const [{ data: programs }, { data: episodes }] = await Promise.all([
    supabase.from("radio_programs").select("id,name,host_name,schedule_text,status").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("radio_episodes").select("id,program_id,title,access_tier,status,published_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(30),
  ]);
  const programMap = new Map((programs ?? []).map((program) => [program.id, program.name]));

  return (
    <div className="max-w-5xl space-y-8">
      <div><h1 className="font-display text-2xl font-semibold text-anil-800">Radio Soy Templo</h1><p className="mt-1 text-sm text-tinta-suave">Organiza programas y construye el archivo para escuchar a la carta. La fuente de audio premium se guarda fuera de las tablas públicas.</p></div>

      <section className="grid gap-5 lg:grid-cols-2">
        <form action={createRadioProgram} className="space-y-3 rounded-[var(--radius-card)] border border-manta bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-anil-800">Nuevo programa</h2>
          <label className="block text-sm font-medium">Nombre<input name="name" required maxLength={140} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Descripción<textarea name="description" maxLength={1200} rows={3} className="mt-1 w-full rounded-xl border border-manta p-3" /></label>
          <label className="block text-sm font-medium">Locutor / anfitrión<input name="hostName" maxLength={120} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Horario visible<input name="scheduleText" maxLength={240} placeholder="Ej. Miércoles · 7:00 p. m." className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Estado<select name="status" defaultValue="draft" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
          <button className="min-h-11 rounded-full bg-anil-600 px-5 font-semibold text-white">Crear programa</button>
        </form>

        <form action={createRadioEpisode} className="space-y-3 rounded-[var(--radius-card)] border border-manta bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-anil-800">Nuevo episodio</h2>
          <label className="block text-sm font-medium">Programa<select name="programId" required className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="">Seleccionar…</option>{(programs ?? []).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
          <label className="block text-sm font-medium">Título<input name="title" required maxLength={180} className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <label className="block text-sm font-medium">Descripción<textarea name="description" maxLength={1600} rows={3} className="mt-1 w-full rounded-xl border border-manta p-3" /></label>
          <label className="block text-sm font-medium">URL HTTPS del audio<input name="sourceUrl" type="url" placeholder="https://…" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Acceso<select name="accessTier" defaultValue="plus" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="plus">Soy Templo+</option><option value="free">Gratis</option></select></label><label className="text-sm font-medium">Estado<select name="status" defaultValue="draft" className="mt-1 min-h-11 w-full rounded-xl border border-manta px-3"><option value="draft">Borrador</option><option value="published">Publicado</option></select></label></div>
          <button disabled={!programs?.length} className="min-h-11 rounded-full bg-anil-600 px-5 font-semibold text-white disabled:opacity-50">Crear episodio</button>
        </form>
      </section>

      <section className="space-y-3"><h2 className="font-display text-xl font-semibold text-anil-800">Episodios recientes</h2>{episodes?.length ? <ul className="space-y-2">{episodes.map((episode) => <li key={episode.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-manta bg-white p-4 text-sm"><div><strong>{episode.title}</strong><p className="text-xs text-tinta-suave">{programMap.get(episode.program_id) || "Programa"}</p></div><div className="flex gap-2"><span className="rounded-full bg-anil-50 px-3 py-1 text-xs font-semibold">{episode.access_tier === "plus" ? "Soy Templo+" : "Gratis"}</span><span className="rounded-full border border-manta px-3 py-1 text-xs">{episode.status}</span></div></li>)}</ul> : <p className="text-sm text-tinta-suave">Todavía no hay episodios archivados.</p>}</section>
    </div>
  );
}
