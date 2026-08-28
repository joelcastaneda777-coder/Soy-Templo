/**
 * Compatibilidad temporal con Server Actions existentes.
 *
 * Desde la migración 0020, las notificaciones de cuidado se generan mediante
 * triggers transaccionales -> private.push_dispatch_queue -> Supabase Edge
 * push-gateway. Mantener estas funciones como no-op evita duplicar avisos y
 * permite migrar los callers gradualmente sin volver a depender de service_role
 * dentro de Vercel.
 */

type CareAlertType = "prayer" | "counseling" | "hospital_visit" | "home_visit";
type CareAlertOptions = { requestId?: string; priority?: "normal" | "soon" | "urgent" };

export async function notifyCareTeam(_type: CareAlertType, _options: CareAlertOptions = {}): Promise<void> {}

export async function notifyCareAssignment(_userId: string, _requestId: string, _type: Exclude<CareAlertType, "prayer">): Promise<void> {}

export async function notifyPublishedPrayer(_prayerId: string): Promise<void> {}
