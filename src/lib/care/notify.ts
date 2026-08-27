import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendPushToCategory, sendPushToUsers } from "@/lib/push/send";

type CareAlertType = "prayer" | "counseling" | "hospital_visit" | "home_visit";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/**
 * Avisa que existe una solicitud nueva. Siempre incluye administradores y
 * superadministradores, además de cualquier miembro activo del equipo de
 * cuidado marcado para recibir avisos. Nunca incluye nombre, teléfono,
 * diagnóstico, hospital, domicilio ni el texto de la solicitud en el push.
 */
export async function notifyCareTeam(type: CareAlertType): Promise<void> {
  try {
    const supabase = getServiceClient();
    if (!supabase) return;

    const [{ data: roleRows }, { data: careRows }] = await Promise.all([
      supabase.from("user_roles").select("user_id").in("role", ["admin", "superadmin"]),
      supabase
        .from("care_team_members")
        .select("user_id")
        .eq("active", true)
        .eq("notify_new_requests", true),
    ]);

    const recipients = [
      ...(roleRows ?? []).map((row) => row.user_id as string),
      ...(careRows ?? []).map((row) => row.user_id as string),
    ];

    const labels: Record<CareAlertType, string> = {
      prayer: "Nueva petición de oración pendiente de revisión",
      counseling: "Nueva solicitud de consejería",
      hospital_visit: "Nueva solicitud de visita hospitalaria",
      home_visit: "Nueva solicitud para Plantadores",
    };

    await sendPushToUsers(recipients, {
      title: "Soy Templo · Cuidado",
      body: labels[type],
      url: type === "prayer" ? "/admin/cuidado?tab=oracion" : "/admin/cuidado",
      tag: `care-${type}-${Date.now()}`,
    });
  } catch {
    // La solicitud pastoral no debe fallar si push está temporalmente indisponible.
  }
}

/**
 * Avisa a la comunidad únicamente después de que una oración pública haya sido
 * moderada y aprobada. Respeta la preferencia de notificaciones de cada dispositivo.
 */
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
