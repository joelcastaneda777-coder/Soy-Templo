import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAuthUsersForAdmin } from "@/app/admin/usuarios/actions";
import {
  addCareNote,
  assignCareRequest,
  moderatePrayer,
  saveCareTeamMember,
  setCareTeamMemberActive,
  unassignCareRequest,
  updateCareStatus,
} from "./actions";

export const metadata: Metadata = { title: "Cuidado pastoral · Panel" };

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
  relationship_to_subject: string | null;
  hospital_name: string | null;
  room_details: string | null;
  address: string | null;
  municipality: string | null;
  location_notes: string | null;
  preferred_schedule: string | null;
  created_at: string;
};

type Prayer = {
  id: string;
  body: string;
  category: string;
  is_public: boolean;
  is_anonymous: boolean;
  allow_pastoral_contact: boolean;
  contact_info: string | null;
  status: string;
  created_at: string;
};

type TeamMember = {
  user_id: string;
  can_counseling: boolean;
  can_hospital_visit: boolean;
  can_home_visit: boolean;
  can_prayer_followup: boolean;
  can_triage: boolean;
  active: boolean;
  notify_new_requests: boolean;
};

type Assignment = { request_id: string; user_id: string; created_at: string };
type Note = { id: string; request_id: string; author_id: string; note: string; created_at: string };
type Profile = { id: string; full_name: string | null; phone: string | null };

const typeLabels: Record<string, string> = {
  counseling: "Consejería",
  hospital_visit: "Visita hospitalaria",
  home_visit: "Plantadores · visita en casa",
};
const statusLabels: Record<string, string> = {
  new: "Nueva", reviewing: "En revisión", assigned: "Asignada", contacted: "Contactada",
  scheduled: "Programada", completed: "Completada", closed: "Cerrada",
};
const prayerStatus: Record<string, string> = {
  pending: "Pendiente", approved: "Aprobada", rejected: "No publicada", answered: "Respondida",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short", timeZone: "America/El_Salvador" }).format(new Date(value));
}

function memberCanHandle(member: TeamMember, requestType: string) {
  if (!member.active) return false;
  if (requestType === "counseling") return member.can_counseling;
  if (requestType === "hospital_visit") return member.can_hospital_visit;
  if (requestType === "home_visit") return member.can_home_visit;
  return false;
}

export default async function AdminCarePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roleSet = new Set((roles ?? []).map((row) => row.role));
  if (!roleSet.has("admin") && !roleSet.has("superadmin")) {
    return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">Esta sección está disponible únicamente para administradores responsables del cuidado pastoral.</p>;
  }

  const [accounts, careResult, prayerResult, teamResult, assignmentResult, notesResult, profileResult] = await Promise.all([
    getAuthUsersForAdmin(),
    supabase.from("care_requests").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    supabase.from("prayer_requests").select("id,body,category,is_public,is_anonymous,allow_pastoral_contact,contact_info,status,created_at").is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
    supabase.from("care_team_members").select("user_id,can_counseling,can_hospital_visit,can_home_visit,can_prayer_followup,can_triage,active,notify_new_requests").order("created_at", { ascending: true }),
    supabase.from("care_assignments").select("request_id,user_id,created_at"),
    supabase.from("care_request_notes").select("id,request_id,author_id,note,created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name,phone"),
  ]);

  const careRequests = (careResult.data ?? []) as CareRequest[];
  const prayers = (prayerResult.data ?? []) as Prayer[];
  const team = (teamResult.data ?? []) as TeamMember[];
  const assignments = (assignmentResult.data ?? []) as Assignment[];
  const notes = (notesResult.data ?? []) as Note[];
  const profiles = (profileResult.data ?? []) as Profile[];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const emailById = new Map(accounts.map((account) => [account.id, account.email]));

  const activeCare = careRequests.filter((request) => !["completed", "closed"].includes(request.status));
  const urgentCount = activeCare.filter((request) => request.priority === "urgent").length;
  const pendingPrayers = prayers.filter((prayer) => prayer.status === "pending");
  const scheduledCount = activeCare.filter((request) => request.status === "scheduled").length;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Confidencial</p>
        <h1 className="font-display text-3xl font-semibold text-anil-800">Cuidado pastoral</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-tinta-suave">Triage de oración, consejería, visitación hospitalaria y Plantadores. Los detalles de esta pantalla no deben compartirse fuera del equipo autorizado.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4" aria-label="Resumen de solicitudes">
        <Card><p className="text-xs text-tinta-suave">Oraciones pendientes</p><p className="mt-1 font-display text-3xl font-semibold">{pendingPrayers.length}</p></Card>
        <Card><p className="text-xs text-tinta-suave">Casos activos</p><p className="mt-1 font-display text-3xl font-semibold">{activeCare.length}</p></Card>
        <Card><p className="text-xs text-tinta-suave">Urgentes</p><p className="mt-1 font-display text-3xl font-semibold">{urgentCount}</p></Card>
        <Card><p className="text-xs text-tinta-suave">Programados</p><p className="mt-1 font-display text-3xl font-semibold">{scheduledCount}</p></Card>
      </section>

      <section className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Bandeja</p><h2 className="font-display text-2xl font-semibold text-anil-800">Solicitudes de cuidado</h2></div>
        {careRequests.length ? careRequests.map((request) => {
          const requestAssignments = assignments.filter((row) => row.request_id === request.id);
          const requestNotes = notes.filter((row) => row.request_id === request.id);
          const eligibleTeam = team.filter((member) => memberCanHandle(member, request.request_type));
          return (
            <Card key={request.id} className={request.priority === "urgent" ? "border-cirio-400" : ""}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="anil">{typeLabels[request.request_type] ?? request.request_type}</Badge>
                <Badge tone={request.status === "completed" ? "balsamo" : "default"}>{statusLabels[request.status] ?? request.status}</Badge>
                {request.priority === "urgent" ? <Badge tone="cirio">Urgente</Badge> : request.priority === "soon" ? <Badge>Pronto</Badge> : null}
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3 text-sm">
                  <div><p className="font-semibold text-anil-800">{request.requester_name}</p><p className="text-xs text-tinta-suave">Recibida {dateLabel(request.created_at)}</p></div>
                  <p className="whitespace-pre-wrap leading-relaxed">{request.message}</p>
                  <div className="rounded-2xl bg-manta/45 p-4 text-xs leading-relaxed">
                    <p><strong>Contacto preferido:</strong> {request.preferred_contact}</p>
                    {request.contact_phone ? <p><strong>Teléfono:</strong> {request.contact_phone}</p> : null}
                    {request.contact_email ? <p><strong>Correo:</strong> {request.contact_email}</p> : null}
                    {request.preferred_schedule ? <p><strong>Horario:</strong> {request.preferred_schedule}</p> : null}
                    {request.request_type === "hospital_visit" ? <>
                      <p className="mt-2"><strong>Persona a visitar:</strong> {request.subject_name}</p>
                      {request.relationship_to_subject ? <p><strong>Relación:</strong> {request.relationship_to_subject}</p> : null}
                      <p><strong>Hospital:</strong> {request.hospital_name}</p>
                      {request.room_details ? <p><strong>Sala / habitación:</strong> {request.room_details}</p> : null}
                    </> : null}
                    {request.request_type === "home_visit" ? <>
                      <p className="mt-2"><strong>Dirección:</strong> {request.address}</p>
                      {request.municipality ? <p><strong>Municipio / distrito:</strong> {request.municipality}</p> : null}
                    </> : null}
                    {request.location_notes ? <p><strong>Indicaciones:</strong> {request.location_notes}</p> : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <form action={updateCareStatus} className="flex gap-2">
                    <input type="hidden" name="requestId" value={request.id} />
                    <select name="status" defaultValue={request.status} className="min-h-10 flex-1 rounded-xl border border-manta bg-white px-3 text-sm">
                      <option value="new">Nueva</option><option value="reviewing">En revisión</option><option value="assigned">Asignada</option><option value="contacted">Contactada</option><option value="scheduled">Programada</option><option value="completed">Completada</option><option value="closed">Cerrada</option>
                    </select>
                    <button className="rounded-full bg-anil-600 px-4 text-sm font-semibold text-white">Estado</button>
                  </form>

                  <div className="rounded-2xl border border-manta p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Asignaciones</p>
                    {requestAssignments.length ? <div className="mt-2 space-y-2">{requestAssignments.map((assignment) => {
                      const person = profilesById.get(assignment.user_id);
                      return <div key={assignment.user_id} className="flex items-center justify-between gap-2 text-sm"><span>{person?.full_name || emailById.get(assignment.user_id) || "Miembro del equipo"}</span><form action={unassignCareRequest}><input type="hidden" name="requestId" value={request.id} /><input type="hidden" name="userId" value={assignment.user_id} /><button className="text-xs font-semibold text-error">Quitar</button></form></div>;
                    })}</div> : <p className="mt-2 text-xs text-tinta-suave">Aún no asignada.</p>}
                    {eligibleTeam.length ? <form action={assignCareRequest} className="mt-3 flex gap-2"><input type="hidden" name="requestId" value={request.id} /><select name="userId" className="min-h-10 flex-1 rounded-xl border border-manta bg-white px-3 text-sm" required defaultValue=""><option value="" disabled>Asignar a…</option>{eligibleTeam.map((member) => <option key={member.user_id} value={member.user_id}>{profilesById.get(member.user_id)?.full_name || emailById.get(member.user_id) || member.user_id}</option>)}</select><button className="rounded-full border border-anil-300 px-3 text-xs font-semibold text-anil-700">Asignar</button></form> : <p className="mt-3 text-xs text-cirio-700">No hay miembros activos habilitados para este tipo de atención.</p>}
                  </div>

                  <div className="rounded-2xl border border-manta p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-tinta-suave">Notas internas</p>
                    {requestNotes.length ? <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">{requestNotes.map((note) => <div key={note.id} className="rounded-xl bg-manta/50 p-2 text-xs"><p>{note.note}</p><p className="mt-1 text-tinta-suave">{profilesById.get(note.author_id)?.full_name || "Equipo"} · {dateLabel(note.created_at)}</p></div>)}</div> : <p className="mt-2 text-xs text-tinta-suave">Sin notas internas.</p>}
                    <form action={addCareNote} className="mt-3 space-y-2"><input type="hidden" name="requestId" value={request.id} /><textarea name="note" required minLength={2} maxLength={3000} placeholder="Seguimiento interno…" className="min-h-20 w-full rounded-xl border border-manta bg-white p-3 text-sm" /><button className="rounded-full border border-manta px-3 py-2 text-xs font-semibold">Agregar nota</button></form>
                  </div>
                </div>
              </div>
            </Card>
          );
        }) : <p className="rounded-2xl border border-manta p-5 text-sm text-tinta-suave">No hay solicitudes de cuidado todavía.</p>}
      </section>

      <section className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Moderación</p><h2 className="font-display text-2xl font-semibold text-anil-800">Peticiones de oración</h2></div>
        {prayers.length ? prayers.map((prayer) => (
          <Card key={prayer.id}>
            <div className="flex flex-wrap items-center gap-2"><Badge tone="anil">{prayer.category}</Badge><Badge>{prayerStatus[prayer.status] ?? prayer.status}</Badge>{prayer.is_public ? <Badge>Solicita muro público</Badge> : <Badge>Privada</Badge>}</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{prayer.body}</p>
            {prayer.allow_pastoral_contact && prayer.contact_info ? <p className="mt-3 rounded-xl bg-manta/50 p-3 text-xs"><strong>Contacto pastoral privado:</strong> {prayer.contact_info}</p> : null}
            <p className="mt-2 text-xs text-tinta-suave">{dateLabel(prayer.created_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={moderatePrayer}><input type="hidden" name="prayerId" value={prayer.id} /><input type="hidden" name="status" value="approved" /><button className="rounded-full bg-anil-600 px-4 py-2 text-xs font-semibold text-white">Aprobar</button></form>
              <form action={moderatePrayer}><input type="hidden" name="prayerId" value={prayer.id} /><input type="hidden" name="status" value="answered" /><button className="rounded-full bg-balsamo-600 px-4 py-2 text-xs font-semibold text-white">Marcar respondida</button></form>
              <form action={moderatePrayer}><input type="hidden" name="prayerId" value={prayer.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full border border-manta px-4 py-2 text-xs font-semibold">No publicar</button></form>
            </div>
          </Card>
        )) : null}
      </section>

      <section className="space-y-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Equipo</p><h2 className="font-display text-2xl font-semibold text-anil-800">Plantadores, Visitación y Consejería</h2><p className="mt-1 text-sm text-tinta-suave">Una persona puede pertenecer al equipo de cuidado sin ser editor ni administrador de contenido.</p></div>
        <Card>
          <form action={saveCareTeamMember} className="space-y-4">
            <label className="block text-sm font-semibold">Agregar o configurar persona
              <select name="userId" required defaultValue="" className="mt-2 min-h-11 w-full rounded-xl border border-manta bg-white px-3 font-normal">
                <option value="" disabled>Selecciona una cuenta registrada</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{profilesById.get(account.id)?.full_name || account.email} · {account.email}</option>)}
              </select>
            </label>
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex gap-2"><input type="checkbox" name="canPrayerFollowup" /> Oración / seguimiento</label>
              <label className="flex gap-2"><input type="checkbox" name="canCounseling" /> Consejería</label>
              <label className="flex gap-2"><input type="checkbox" name="canHospitalVisit" /> Visitación hospitalaria</label>
              <label className="flex gap-2"><input type="checkbox" name="canHomeVisit" /> Plantadores / casas</label>
              <label className="flex gap-2"><input type="checkbox" name="canTriage" /> Triage de todos los casos</label>
              <label className="flex gap-2"><input type="checkbox" name="notifyNewRequests" defaultChecked /> Recibir avisos</label>
            </div>
            <button className="rounded-full bg-anil-600 px-5 py-2 text-sm font-semibold text-white">Guardar en equipo de cuidado</button>
          </form>
        </Card>

        {team.length ? <div className="grid gap-3 sm:grid-cols-2">{team.map((member) => {
          const name = profilesById.get(member.user_id)?.full_name || emailById.get(member.user_id) || "Miembro";
          return <Card key={member.user_id} className={!member.active ? "opacity-60" : ""}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-anil-800">{name}</p><p className="text-xs text-tinta-suave">{emailById.get(member.user_id)}</p></div><Badge tone={member.active ? "balsamo" : "default"}>{member.active ? "Activo" : "Pausado"}</Badge></div>
            <form action={saveCareTeamMember} className="mt-4 space-y-3"><input type="hidden" name="userId" value={member.user_id} /><div className="grid gap-2 text-xs sm:grid-cols-2"><label><input type="checkbox" name="canPrayerFollowup" defaultChecked={member.can_prayer_followup} /> Oración</label><label><input type="checkbox" name="canCounseling" defaultChecked={member.can_counseling} /> Consejería</label><label><input type="checkbox" name="canHospitalVisit" defaultChecked={member.can_hospital_visit} /> Hospitales</label><label><input type="checkbox" name="canHomeVisit" defaultChecked={member.can_home_visit} /> Plantadores</label><label><input type="checkbox" name="canTriage" defaultChecked={member.can_triage} /> Triage</label><label><input type="checkbox" name="notifyNewRequests" defaultChecked={member.notify_new_requests} /> Avisos</label></div><button className="text-xs font-semibold text-anil-700 underline underline-offset-4">Actualizar funciones</button></form>
            <form action={setCareTeamMemberActive} className="mt-3"><input type="hidden" name="userId" value={member.user_id} /><input type="hidden" name="active" value={member.active ? "false" : "true"} /><button className="text-xs font-semibold text-tinta-suave underline underline-offset-4">{member.active ? "Pausar acceso" : "Reactivar acceso"}</button></form>
          </Card>;
        })}</div> : null}
      </section>
    </div>
  );
}
