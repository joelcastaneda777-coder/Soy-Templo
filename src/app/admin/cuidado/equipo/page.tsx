import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthUsersForAdmin } from "@/app/admin/usuarios/actions";
import { saveCareLeadershipMember, setCareLeadershipActive } from "./actions";

export const metadata: Metadata = { title: "Equipo de cuidado · Administración" };

type Member = { user_id:string; ministry_title:string|null; is_supervisor:boolean; can_prayer_followup:boolean; can_counseling:boolean; can_hospital_visit:boolean; can_home_visit:boolean; lead_prayer:boolean; lead_counseling:boolean; lead_hospital_visit:boolean; lead_home_visit:boolean; can_triage:boolean; can_assign:boolean; can_manage_status:boolean; notify_new_requests:boolean; notify_urgent:boolean; notify_assignment:boolean; active:boolean };

function MemberForm({ member, userId }: { member?: Member; userId: string }) {
  return <form action={saveCareLeadershipMember} className="mt-4 space-y-4">
    <input type="hidden" name="userId" value={userId} />
    <label className="block text-sm font-semibold">Título ministerial<input name="ministryTitle" defaultValue={member?.ministry_title ?? ""} placeholder="Ej. Líder de Visitación" className="mt-1 min-h-10 w-full rounded-xl border border-manta bg-white px-3 font-normal" /></label>
    <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
      <label><input type="checkbox" name="isSupervisor" defaultChecked={member?.is_supervisor} /> Pastor supervisor · ve todo</label>
      <label><input type="checkbox" name="canPrayerFollowup" defaultChecked={member?.can_prayer_followup} /> Oración / seguimiento</label>
      <label><input type="checkbox" name="canCounseling" defaultChecked={member?.can_counseling} /> Consejería</label>
      <label><input type="checkbox" name="canHospitalVisit" defaultChecked={member?.can_hospital_visit} /> Visitación hospitalaria</label>
      <label><input type="checkbox" name="canHomeVisit" defaultChecked={member?.can_home_visit} /> Plantadores / casas</label>
      <label><input type="checkbox" name="leadPrayer" defaultChecked={member?.lead_prayer} /> Líder de Oración</label>
      <label><input type="checkbox" name="leadCounseling" defaultChecked={member?.lead_counseling} /> Líder de Consejería</label>
      <label><input type="checkbox" name="leadHospitalVisit" defaultChecked={member?.lead_hospital_visit} /> Líder de Visitación</label>
      <label><input type="checkbox" name="leadHomeVisit" defaultChecked={member?.lead_home_visit} /> Líder de Plantadores</label>
      <label><input type="checkbox" name="canTriage" defaultChecked={member?.can_triage} /> Triage general</label>
      <label><input type="checkbox" name="canAssign" defaultChecked={member?.can_assign} /> Puede asignar casos</label>
      <label><input type="checkbox" name="canManageStatus" defaultChecked={member ? member.can_manage_status : true} /> Puede actualizar estados</label>
      <label><input type="checkbox" name="notifyNewRequests" defaultChecked={member?.notify_new_requests} /> Recibir nuevas solicitudes</label>
      <label><input type="checkbox" name="notifyUrgent" defaultChecked={member ? member.notify_urgent : true} /> Avisos urgentes</label>
      <label><input type="checkbox" name="notifyAssignment" defaultChecked={member ? member.notify_assignment : true} /> Aviso al ser asignado</label>
    </div>
    <button className="rounded-full bg-anil-600 px-5 py-2 text-sm font-semibold text-white">Guardar responsabilidades</button>
  </form>;
}

export default async function CareTeamAdminPage() {
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser(); if (!user) return null;
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((r) => r.role === "admin" || r.role === "superadmin")) return <p>Sin permiso.</p>;
  const [accounts, teamResult, profileResult] = await Promise.all([
    getAuthUsersForAdmin(),
    supabase.from("care_team_members").select("user_id,ministry_title,is_supervisor,can_prayer_followup,can_counseling,can_hospital_visit,can_home_visit,lead_prayer,lead_counseling,lead_hospital_visit,lead_home_visit,can_triage,can_assign,can_manage_status,notify_new_requests,notify_urgent,notify_assignment,active").order("created_at"),
    supabase.from("profiles").select("id,full_name"),
  ]);
  const team=(teamResult.data ?? []) as Member[]; const names=new Map((profileResult.data ?? []).map((p)=>[p.id,p.full_name])); const emails=new Map(accounts.map((a)=>[a.id,a.email]));
  return <div className="max-w-5xl space-y-7">
    <div><Link href="/admin/cuidado" className="text-sm font-semibold text-anil-600">← Cuidado pastoral</Link><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-balsamo-700">Configuración</p><h1 className="font-display text-3xl font-semibold text-anil-800">Equipo de cuidado pastoral</h1><p className="mt-2 max-w-3xl text-sm text-tinta-suave">Los permisos de cuidado son independientes de editor/admin. Un líder solo ve su área; un miembro normal solo ve casos asignados; el Pastor supervisor ve todas las áreas.</p></div>
    <Card><h2 className="font-display text-xl font-semibold">Agregar persona</h2><form action={saveCareLeadershipMember} className="mt-4 space-y-4"><select name="userId" required defaultValue="" className="min-h-11 w-full rounded-xl border border-manta bg-white px-3"><option value="" disabled>Selecciona una cuenta registrada</option>{accounts.map((a)=><option key={a.id} value={a.id}>{names.get(a.id) || a.email} · {a.email}</option>)}</select><label className="block text-sm font-semibold">Título ministerial<input name="ministryTitle" placeholder="Ej. Líder de Visitación" className="mt-1 min-h-10 w-full rounded-xl border border-manta bg-white px-3 font-normal" /></label><div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3"><label><input type="checkbox" name="isSupervisor" /> Pastor supervisor</label><label><input type="checkbox" name="canPrayerFollowup" /> Oración</label><label><input type="checkbox" name="canCounseling" /> Consejería</label><label><input type="checkbox" name="canHospitalVisit" /> Hospitales</label><label><input type="checkbox" name="canHomeVisit" /> Plantadores</label><label><input type="checkbox" name="leadPrayer" /> Líder de Oración</label><label><input type="checkbox" name="leadCounseling" /> Líder de Consejería</label><label><input type="checkbox" name="leadHospitalVisit" /> Líder de Visitación</label><label><input type="checkbox" name="leadHomeVisit" /> Líder de Plantadores</label><label><input type="checkbox" name="canTriage" /> Triage general</label><label><input type="checkbox" name="canAssign" /> Puede asignar</label><label><input type="checkbox" name="canManageStatus" defaultChecked /> Actualiza estados</label><label><input type="checkbox" name="notifyNewRequests" /> Nuevas solicitudes</label><label><input type="checkbox" name="notifyUrgent" defaultChecked /> Urgentes</label><label><input type="checkbox" name="notifyAssignment" defaultChecked /> Cuando se le asigna</label></div><button className="rounded-full bg-anil-600 px-5 py-2 text-sm font-semibold text-white">Agregar al equipo</button></form></Card>
    <section className="grid gap-4 sm:grid-cols-2">{team.map((m)=><Card key={m.user_id} className={!m.active?"opacity-60":""}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-anil-800">{names.get(m.user_id) || emails.get(m.user_id) || "Miembro"}</p><p className="text-xs text-tinta-suave">{m.ministry_title || (m.is_supervisor?"Pastor supervisor":"Equipo de cuidado")}</p></div><Badge tone={m.active?"balsamo":"neutral"}>{m.active?"Activo":"Pausado"}</Badge></div><MemberForm member={m} userId={m.user_id}/><form action={setCareLeadershipActive} className="mt-3"><input type="hidden" name="userId" value={m.user_id}/><input type="hidden" name="active" value={m.active?"false":"true"}/><button className="text-xs font-semibold text-tinta-suave underline">{m.active?"Pausar acceso":"Reactivar acceso"}</button></form></Card>)}</section>
  </div>;
}
