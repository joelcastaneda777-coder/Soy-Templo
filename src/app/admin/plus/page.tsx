import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Soy Templo+</h1>
        <p className="mt-1 text-sm text-tinta-suave">Suscripciones y derechos premium. Google Play será la fuente principal cuando activemos el cobro Android.</p>
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
          <p className="text-xs text-tinta-suave">Proveedor previsto</p>
          <p className="mt-1 font-semibold">Google Play</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-anil-800">Suscripciones recientes</h2>
        {subscriptions?.length ? (
          <ul className="space-y-2">
            {subscriptions.map((item) => (
              <li key={item.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 text-sm dark:bg-manta">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong>{names.get(item.user_id) || "Usuario Soy Templo"}</strong>
                    <p className="mt-1 text-xs text-tinta-suave">{item.product_id} · {item.provider} · {item.environment}</p>
                  </div>
                  <span className="rounded-full bg-anil-50 px-3 py-1 text-xs font-semibold text-anil-700">{item.status}</span>
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
            Todavía no hay suscripciones. Esto es normal hasta conectar Google Play Billing.
          </p>
        )}
      </div>
    </div>
  );
}
