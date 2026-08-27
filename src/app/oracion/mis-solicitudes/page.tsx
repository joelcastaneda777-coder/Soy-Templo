import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = { title: "Mis solicitudes de oración y cuidado" };

const careTypeLabels: Record<string, string> = {
  counseling: "Consejería pastoral",
  hospital_visit: "Visita hospitalaria",
  home_visit: "Visita en casa · Plantadores",
};

const careStatusLabels: Record<string, string> = {
  new: "Recibida",
  reviewing: "En revisión",
  assigned: "Asignada al equipo",
  contacted: "Contacto iniciado",
  scheduled: "Programada",
  completed: "Acompañamiento realizado",
  closed: "Cerrada",
};

const prayerStatusLabels: Record<string, string> = {
  pending: "Recibida · en revisión",
  approved: "Compartida con la comunidad",
  rejected: "Revisada · no publicada",
  answered: "Respondida",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeZone: "America/El_Salvador",
  }).format(new Date(value));
}

export default async function MyCareRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/oracion/mis-solicitudes");

  const [{ data: prayers }, { data: careRequests }] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("id, body, category, status, is_public, created_at, answered_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("care_requests")
      .select("id, request_type, message, priority, status, hospital_name, municipality, preferred_schedule, created_at, completed_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const hasAnything = Boolean(prayers?.length || careRequests?.length);

  return (
    <div className="space-y-6">
      <PageHero title="Mis solicitudes" subtitle="Consulta el estado de tus peticiones de oración y acompañamiento." />

      <div className="mx-auto max-w-3xl space-y-7">
        <Link href="/oracion" className="inline-block text-sm font-semibold text-anil-600">← Volver a Oración y cuidado</Link>

        {!hasAnything ? (
          <EmptyState title="Todavía no has enviado solicitudes." />
        ) : null}

        {careRequests?.length ? (
          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Confidencial</p>
              <h2 className="font-display text-xl font-semibold text-anil-800">Acompañamiento pastoral</h2>
            </div>
            {careRequests.map((request) => (
              <Card key={request.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="anil">{careTypeLabels[request.request_type] ?? request.request_type}</Badge>
                  <Badge tone={request.status === "completed" ? "balsamo" : "default"}>
                    {careStatusLabels[request.status] ?? request.status}
                  </Badge>
                  {request.priority === "urgent" ? <Badge tone="cirio">Urgente</Badge> : null}
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{request.message}</p>
                <div className="mt-3 space-y-1 text-xs text-tinta-suave">
                  <p>Enviada: {dateLabel(request.created_at)}</p>
                  {request.hospital_name ? <p>Centro de salud: {request.hospital_name}</p> : null}
                  {request.municipality ? <p>Zona: {request.municipality}</p> : null}
                  {request.preferred_schedule ? <p>Horario sugerido: {request.preferred_schedule}</p> : null}
                  {request.completed_at ? <p>Finalizada: {dateLabel(request.completed_at)}</p> : null}
                </div>
              </Card>
            ))}
          </section>
        ) : null}

        {prayers?.length ? (
          <section className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Oración</p>
              <h2 className="font-display text-xl font-semibold text-anil-800">Mis peticiones</h2>
            </div>
            {prayers.map((prayer) => (
              <Card key={prayer.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="anil">{prayer.category}</Badge>
                  <Badge tone={prayer.status === "answered" ? "balsamo" : "default"}>
                    {prayerStatusLabels[prayer.status] ?? prayer.status}
                  </Badge>
                  {prayer.is_public ? <Badge>Solicitada para el muro</Badge> : <Badge>Privada</Badge>}
                </div>
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{prayer.body}</p>
                <p className="mt-3 text-xs text-tinta-suave">Enviada: {dateLabel(prayer.created_at)}</p>
              </Card>
            ))}
          </section>
        ) : null}

        <p className="rounded-2xl bg-manta/50 p-4 text-xs leading-relaxed text-tinta-suave">
          Las notas internas del equipo de cuidado no aparecen en esta pantalla. Si necesitas corregir datos de contacto o cancelar una visita, comunícalo cuando el equipo se ponga en contacto contigo.
        </p>
      </div>
    </div>
  );
}
