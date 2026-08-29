import { createClient } from "@/lib/supabase/server";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    trialing: "Prueba",
    active: "Activa",
    grace_period: "Gracia",
    paused: "Pausada",
    canceled: "Cancelada",
    expired: "Vencida",
  };
  return labels[status] ?? status;
}

export default async function AdminPlusPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("has_role", { check_role: "admin" });

  if (!isAdmin) {
    return (
      <div className="max-w-3xl rounded-[var(--radius-card)] border border-manta bg-white p-6 dark:bg-manta">
        <h1 className="font-display text-2xl font-semibold text-anil-800">Soy Templo+</h1>
        <p className="mt-2 text-sm text-tinta-suave">Solo los administradores pueden consultar información de suscripciones.</p>
      </div>
    );
  }

  const { data: subscriptions } = await supabase
    .from("plus_subscriptions")
    .select("id,user_id,provider,product_id,status,current_period_end,auto_renewing,environment,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = [...new Set((subscriptions ?? []).map((item) => item.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const activeCount = (subscriptions ?? []).filter((item) => ["trialing", "active", "grace_period"].includes(item.status)).length;
  const autoRenewCount = (subscriptions ?? []).filter((item) => item.auto_renewing).length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#063547,#084B53_52%,#021F25)] p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Suscripciones</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Soy Templo+</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
          Control de derechos premium y suscripciones. La capa de acceso permanece separada de las donaciones y preparada para conectar el proveedor de cobro definitivo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
          <p className="text-xs text-tinta-suave">Registros</p>
          <p className="mt-1 text-2xl font-semibold">{subscriptions?.length ?? 0}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
          <p className="text-xs text-tinta-suave">Con acceso activo</p>
          <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
          <p className="text-xs text-tinta-suave">Renovación automática</p>
          <p className="mt-1 text-2xl font-semibold">{autoRenewCount}</p>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-anil-800">Suscripciones recientes</h2>
          <p className="mt-1 text-sm text-tinta-suave">Este panel refleja el estado registrado en Soy Templo; el proveedor externo será la fuente de verificación al activar cobros reales.</p>
        </div>
        {subscriptions?.length ? (
          <ul className="space-y-2">
            {subscriptions.map((item) => (
              <li key={item.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 text-sm dark:bg-manta">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>{names.get(item.user_id) || "Usuario Soy Templo"}</strong>
                    <p className="mt-1 text-xs text-tinta-suave">{item.product_id} · {item.provider} · {item.environment}</p>
                  </div>
                  <span className="rounded-full bg-[#063547]/10 px-3 py-1 text-xs font-semibold text-[#063547]">{statusLabel(item.status)}</span>
                </div>
                <p className="mt-2 text-xs text-tinta-suave">
                  {item.current_period_end ? `Periodo hasta ${new Date(item.current_period_end).toLocaleDateString("es-SV")}` : "Sin fecha de vencimiento"}
                  {item.auto_renewing ? " · renovación automática" : " · sin renovación automática"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm text-tinta-suave dark:bg-manta">
            Todavía no hay suscripciones reales. La arquitectura de acceso premium está lista para las pruebas de integración del proveedor de cobro.
          </p>
        )}
      </section>
    </div>
  );
}
