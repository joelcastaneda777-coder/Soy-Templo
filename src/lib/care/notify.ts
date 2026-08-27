import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToUsers } from "@/lib/push/send";

type CareAlertType = "prayer" | "counseling" | "hospital_visit" | "home_visit";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

const capabilityColumn: Record<Exclude<CareAlertType, "prayer">, string> = {
  counseling: "can_counseling",
  hospital_visit: "can_hospital_visit",
  home_visit: "can_home_visit",
};

/**
 * Avisa solo que existe un caso nuevo. Nunca incluye nombre, teléfono,
 * diagnóstico, hospital, domicilio ni el texto de la solicitud en el push.
 */
export async function notifyCareTeam(type: CareAlertType): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;

    const [{ data: roleRows }, { data: careRows }] = await Promise.all([
      supabase.from("user_roles").select("user_id").in("role", ["admin", "superadmin"]),
      type === "prayer"
        ? supabase
            .from("care_team_members")
            .select("user_id")
            .eq("active", true)
            .eq("notify_new_requests", true)
            .or("can_triage.eq.true,can_prayer_followup.eq.true")
        : supabase
            .from("care_team_members")
            .select("user_id")
            .eq("active", true)
            .eq("notify_new_requests", true)
            .or(`can_triage.eq.true,${capabilityColumn[type]}.eq.true`),
    ]);

    const recipients = [
      ...(roleRows ?? []).map((row) => row.user_id as string),
      ...(careRows ?? []).map((row) => row.user_id as string),
    ];

    const labels: Record<CareAlertType, string> = {
      prayer: "Nueva petición de oración",
      counseling: "Nueva solicitud de consejería",
      hospital_visit: "Nueva solicitud de visita hospitalaria",
      home_visit: "Nueva solicitud para Plantadores",
    };

    await sendPushToUsers(recipients, {
      title: "Soy Templo · Cuidado",
      body: labels[type],
      url: type === "prayer" ? "/admin/cuidado?tab=oracion" : "/admin/cuidado",
      tag: `care-${type}`,
    });
  } catch {
    // La solicitud pastoral no debe fallar si push está temporalmente indisponible.
  }
}
