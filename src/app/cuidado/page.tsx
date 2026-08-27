import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { addAssignedCareNote, updateAssignedCareStatus } from "./actions";

export const metadata: Metadata = { title: "Equipo de cuidado" };

type CareRequest = {
  id: string;
  request_type: string;
  requester_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  preferred_contact: string;
  message: string;
  priority: string;
  status: string;
  subject_name: string | null;
  hospital_name: string | null;
  room_details: string | null;
  address: string | null;
  municipality: string | null;
  location_notes: string | null;
  preferred_schedule: string | null;
  created_at: string;
};

type Note = { id: string; request_id: string; note: string; created_at: string };

const typeLabels: Record<string, string> = {
  counseling: "Consejería pastoral",
  hospital_visit: "Visitación hospitalaria",
  home_visit: "Plantadores · visita en casa",
};
const statusLabels: Record<string, string> = {
  new: "Nueva", reviewing: "En revisión", assigned: "Asignada", contacted: "Contacto iniciado",
  scheduled: "Programada", completed: "Completada", closed: "Cerrada",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short", timeZone: "America/El_Salvador" }).format(new Date(value));
}

export default async function CareWorkerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/cuidado");

  const [{ data: member }, { data: roles }] = await Promise.all([
    supabase.from("care_team_members").select("active,can_triage,can_counseling,can_hospital_visit,can_home_visit").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const isAdmin = (roles ?? []).some((row) => row.role === "admin" || row.role === "superadmin");
  if (!isAdmin && !member?.active) redirect("/");
  const canTriage = isAdmin || Boolean(member?.can_triage);

  let requests: CareRequest[] = [];
  if (canTriage) {
    const { data } = await supabase.from("care_requests").select("*").is("deleted_at", null).not("status", "in", "(completed,closed)").order("created_at", { ascending: true });
    requests = (data ?? []) as CareRequest[];
  } else {
    const { data: assignments } = await supabase.from("care_assignments").select("request_id").eq("user_id", user.id);
    const ids = (assignments ?? []).map((row) => row.request_id);
    if (ids.length) {
      const { data } = await supabase.from("care_requests").select("*").in("id", ids).is("deleted_at", null).order("created_at", { ascending: true });
      requests = (data ?? []) as CareRequest[];
    }
  }

  const requestIds = requests.map((request) => request.id);
  let notes: Note[] = [];
  if (requestIds.length) {
    const { data } = await supabase.from("care_request_notes").select("id,request_id,note,created_at").in("request_id", requestIds).order("created_at", { ascending: false });
    notes = (data ?? []) as Note[];
  }

  return (
    <div className="space-y-7">
      <PageHero title="Equipo de cuidado" subtitle="Casos de acompañamiento asignados a Plantadores, Visitación y Consejería." />
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-[var(--radius-card)] border border-cirio-200 bg-cirio-50 p-4 text-xs leading-relaxed text-tinta-suave">
          <strong className="text-tinta">Información confidencial.</strong> Úsala únicamente para coordinar y realizar el acompañamiento asignado. No compartas nombres, teléfonos, hospitales, domicilios o relatos fuera del equipo autorizado.
        </div>

        {isAdmin ? <Link href="/admin/cuidado" className="inline-block text-sm font-semibold text-anil-600">Abrir triage administrativo →</Link> : null}

        {!requests.length ? <EmptyState title="No tienes casos asignados en este momento." /> : null}

        {requests.map((request) => {
          const requestNotes = notes.filter((note) => note.request_id === request.id);
          return (
            <Card key={request.id} className={request.priority === "urgent" ? "border-cirio-400" : ""}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="anil">{typeLabels[request.request_type] ?? request.request_type}</Badge>
                <Badge>{statusLabels[request.status] ?? request.status}</Badge>
                {request.priority === "urgent" ? <Badge tone="cirio">Urgente</Badge> : null}
              </div>

              <div className="mt-4 space-y-3">
                <div><h2 className="font-display text-xl font-semibold text-anil-800">{request.requester_name}</h2><p className="text-xs text-tinta-suave">Recibida {dateLabel(request.created_at)}</p></div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.message}</p>
                <div className="rounded-2xl bg-manta/50 p-4 text-sm leading-relaxed">
                  <p><strong>Contacto:</strong> {request.contact_phone || request.contact_email}</p>
                  <p><strong>Preferencia:</strong> {request.preferred_contact}</p>
                  {request.preferred_schedule ? <p><strong>Horario sugerido:</strong> {request.preferred_schedule}</p> : null}
                  {request.request_type === "hospital_visit" ? <><p className="mt-2"><strong>Persona:</strong> {request.subject_name}</p><p><strong>Hospital:</strong> {request.hospital_name}</p>{request.room_details ? <p><strong>Sala / habitación:</strong> {request.room_details}</p> : null}</> : null}
                  {request.request_type === "home_visit" ? <><p className="mt-2"><strong>Dirección:</strong> {request.address}</p>{request.municipality ? <p><strong>Municipio / distrito:</strong> {request.municipality}</p> : null}</> : null}
                  {request.location_notes ? <p><strong>Indicaciones:</strong> {request.location_notes}</p> : null}
                </div>
              </div>

              {! ["completed", "closed"].includes(request.status) ? (
                <form action={updateAssignedCareStatus} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="requestId" value={request.id} />
                  <select name="status" defaultValue={request.status === "scheduled" ? "scheduled" : request.status === "contacted" ? "contacted" : "contacted"} className="min-h-10 flex-1 rounded-xl border border-manta bg-white px-3 text-sm">
                    <option value="contacted">Ya hice contacto</option>
                    <option value="scheduled">Quedó programado</option>
                    <option value="completed">Acompañamiento realizado</option>
                  </select>
                  <button className="rounded-full bg-anil-600 px-4 text-sm font-semibold text-white">Actualizar</button>
                </form>
              ) : null}

              <div className="mt-4 border-t border-manta pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Seguimiento interno</p>
                {requestNotes.length ? <div className="mt-2 space-y-2">{requestNotes.slice(0, 5).map((note) => <div key={note.id} className="rounded-xl bg-manta/40 p-3 text-xs"><p>{note.note}</p><p className="mt-1 text-tinta-suave">{dateLabel(note.created_at)}</p></div>)}</div> : null}
                <form action={addAssignedCareNote} className="mt-3 flex gap-2"><input type="hidden" name="requestId" value={request.id} /><input name="note" required minLength={2} maxLength={3000} placeholder="Nota breve de seguimiento" className="min-h-10 flex-1 rounded-xl border border-manta bg-white px-3 text-sm" /><button className="rounded-full border border-manta px-4 text-xs font-semibold">Guardar nota</button></form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
