import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToCategory, sendPushToUsers } from "@/lib/push/send";

type CareAlertType = "prayer" | "counseling" | "hospital_visit" | "home_visit";
type CareAlertOptions = { requestId?: string; priority?: "normal" | "soon" | "urgent" };

type CareRecipient = {
  user_id: string;
  active: boolean;
  is_supervisor: boolean;
  can_triage: boolean;
  can_prayer_followup: boolean;
  can_counseling: boolean;
  can_hospital_visit: boolean;
  can_home_visit: boolean;
  lead_prayer: boolean;
  lead_counseling: boolean;
  lead_hospital_visit: boolean;
  lead_home_visit: boolean;
  notify_new_requests: boolean;
  notify_assignment: boolean;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

function handlesType(member: CareRecipient, type: CareAlertType) {
  if (member.is_supervisor || member.can_triage) return true;
  if (type === "prayer") return member.lead_prayer || member.can_prayer_followup;
  if (type === "counseling") return member.lead_counseling || member.can_counseling;
  if (type === "hospital_visit") return member.lead_hospital_visit || member.can_hospital_visit;
  return member.lead_home_visit || member.can_home_visit;
}

const labels: Record<CareAlertType, string> = {
  prayer: "Nueva petición de oración pendiente de revisión",
  counseling: "Nueva solicitud de consejería",
  hospital_visit: "Nueva solicitud de visita hospitalaria",
  home_visit: "Nueva solicitud para Plantadores",
};

async function saveInternalNotification(userIds: string[], input: { kind: "care_new" | "care_urgent" | "care_assignment"; title: string; body: string; url: string; requestId?: string }) {
  const supabase = getServiceClient();
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!supabase || !recipients.length) return;
  await supabase.from("user_notifications").insert(recipients.map((userId) => ({
    user_id: userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    url: input.url,
    related_care_request_id: input.requestId ?? null,
  })));
}

/**
 * Las solicitudes nuevas se enrutan al equipo pastoral configurado para esa
 * categoría. Los administradores solo son respaldo cuando aún no existe un
 * destinatario pastoral activo, para que ningún caso quede invisible.
 */
export async function notifyCareTeam(type: CareAlertType, options: CareAlertOptions = {}): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;

    const { data: careRows } = await supabase
      .from("care_team_members")
      .select("user_id,active,is_supervisor,can_triage,can_prayer_followup,can_counseling,can_hospital_visit,can_home_visit,lead_prayer,lead_counseling,lead_hospital_visit,lead_home_visit,notify_new_requests,notify_assignment")
      .eq("active", true);

    const configured = ((careRows ?? []) as CareRecipient[])
      .filter((member) => member.notify_new_requests && handlesType(member, type))
      .map((member) => member.user_id);

    let recipients = [...new Set(configured)];
    if (!recipients.length) {
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "superadmin"]);
      recipients = [...new Set((roleRows ?? []).map((row) => row.user_id as string))];
    }

    const urgent = options.priority === "urgent";
    const title = urgent ? "Soy Templo · Cuidado urgente" : "Soy Templo · Cuidado";
    const body = labels[type];
    const url = type === "prayer" ? "/cuidado?tab=oracion" : "/cuidado";

    await Promise.all([
      saveInternalNotification(recipients, { kind: urgent ? "care_urgent" : "care_new", title, body, url, requestId: options.requestId }),
      sendPushToUsers(recipients, { title, body, url, tag: `care-${type}-${options.requestId ?? Date.now()}` }),
    ]);
  } catch {
    // La solicitud pastoral nunca debe fallar si los avisos están indisponibles.
  }
}

export async function notifyCareAssignment(userId: string, requestId: string, type: Exclude<CareAlertType, "prayer">): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;
    const body = `Te asignaron: ${labels[type].replace(/^Nueva solicitud de /, "").replace(/^Nueva solicitud para /, "")}`;
    const title = "Soy Templo · Nuevo caso asignado";
    await saveInternalNotification([userId], { kind: "care_assignment", title, body, url: "/cuidado", requestId });

    const { data: member } = await supabase.from("care_team_members").select("notify_assignment").eq("user_id", userId).maybeSingle();
    if (member?.notify_assignment !== false) {
      await sendPushToUsers([userId], { title, body, url: "/cuidado", tag: `care-assignment-${requestId}-${userId}` });
    }
  } catch {
    // La asignación no debe fallar por un problema de avisos.
  }
}

export async function notifyPublishedPrayer(prayerId: string): Promise<void> {
  try {
    await sendPushToCategory("prayer", {
      title: "Oremos juntos 🙏",
      body: "Hay una nueva petición pública de oración. Acompañemos a nuestra comunidad.",
      url: "/oracion",
      tag: `community-prayer-${prayerId}`,
    });
  } catch {
    // La moderación no debe fallar si push está temporalmente indisponible.
  }
}
