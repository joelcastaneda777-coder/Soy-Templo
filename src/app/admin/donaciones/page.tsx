import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { completeSettlement, cancelSettlement, createSettlement } from "./actions";

export const metadata: Metadata = { title: "Donaciones · Panel" };

const money = (cents: number | null | undefined) => `$${((cents ?? 0) / 100).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleString("es-SV", { timeZone: "America/El_Salvador" });

export default async function AdminDonationsPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("has_role", { check_role: "admin" });
  if (!isAdmin) {
    return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">La conciliación financiera está disponible únicamente para administradores.</p>;
  }

  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("id,donation_id,provider,reference_id,provider_capture_id,gross_amount_cents,fee_amount_cents,net_amount_cents,settled_at,created_at")
    .eq("status", "completed")
    .is("settlement_id", null)
    .order("created_at", { ascending: false })
    .limit(100);

  const donationIds = [...new Set((transactions ?? []).map((tx) => tx.donation_id))];
  const { data: donations } = donationIds.length
    ? await supabase.from("donations").select("id,category_id,amount_cents,currency,is_anonymous,donor_name,donor_email,created_at").in("id", donationIds)
    : { data: [] };
  const categoryIds = [...new Set((donations ?? []).map((d) => d.category_id).filter(Boolean))] as string[];
  const { data: categories } = categoryIds.length
    ? await supabase.from("donation_categories").select("id,name").in("id", categoryIds)
    : { data: [] };

  const donationMap = new Map((donations ?? []).map((d) => [d.id, d]));
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const { data: settlements } = await supabase
    .from("donation_settlements")
    .select("id,provider_reference,gross_amount_cents,fee_amount_cents,net_amount_cents,status,initiated_at,deposited_at,notes")
    .order("initiated_at", { ascending: false })
    .limit(30);

  const pendingNet = (transactions ?? []).reduce((sum, tx) => sum + (tx.net_amount_cents ?? 0), 0);

  return (
    <div className="max-w-5xl space-y-7">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Donaciones y conciliación</h1>
        <p className="mt-1 text-sm text-tinta-suave">PayPal recibe la donación. Tesorería hace el retiro manual y este panel registra qué pagos fueron incluidos y cuándo llegaron al BAC institucional.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4"><p className="text-xs text-tinta-suave">Pagos por conciliar</p><p className="mt-1 text-2xl font-semibold">{transactions?.length ?? 0}</p></div>
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4"><p className="text-xs text-tinta-suave">Neto PayPal pendiente</p><p className="mt-1 text-2xl font-semibold">{money(pendingNet)}</p></div>
        <div className="rounded-[var(--radius-card)] border border-manta bg-white p-4"><p className="text-xs text-tinta-suave">Destino</p><p className="mt-1 font-semibold">BAC institucional</p></div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-anil-800">Preparar transferencia</h2>
          <p className="text-sm text-tinta-suave">Primero inicia el retiro en PayPal. Luego selecciona aquí las donaciones que forman ese retiro. El panel no mueve dinero por sí mismo.</p>
        </div>

        {transactions?.length ? (
          <form action={createSettlement} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead><tr className="border-b border-manta text-xs text-tinta-suave"><th className="p-2">Incluir</th><th className="p-2">Donante</th><th className="p-2">Destino</th><th className="p-2">Bruto</th><th className="p-2">Comisión</th><th className="p-2">Neto</th><th className="p-2">Fecha</th></tr></thead>
                <tbody>
                  {transactions.map((tx) => {
                    const donation = donationMap.get(tx.donation_id);
                    const ready = tx.gross_amount_cents != null && tx.net_amount_cents != null;
                    return (
                      <tr key={tx.id} className="border-b border-manta/60 last:border-0">
                        <td className="p-2"><input type="checkbox" name="transactionIds" value={tx.id} disabled={!ready} className="h-5 w-5 accent-anil-600" /></td>
                        <td className="p-2"><div>{donation?.is_anonymous ? "Anónimo" : donation?.donor_name || donation?.donor_email || "Sin nombre"}</div><div className="text-xs text-tinta-suave">{tx.provider} · {tx.reference_id}</div></td>
                        <td className="p-2">{donation?.category_id ? categoryMap.get(donation.category_id) ?? "General" : "General"}</td>
                        <td className="p-2">{money(tx.gross_amount_cents ?? donation?.amount_cents)}</td>
                        <td className="p-2">{ready ? money(tx.fee_amount_cents) : "Pendiente"}</td>
                        <td className="p-2 font-semibold">{ready ? money(tx.net_amount_cents) : "Sin desglose"}</td>
                        <td className="p-2 text-xs">{date(tx.settled_at ?? tx.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Referencia del retiro PayPal<input name="providerReference" maxLength={160} placeholder="Opcional hasta confirmar el retiro" className="mt-1 min-h-12 w-full rounded-xl border border-manta bg-white px-3" /></label>
              <label className="text-sm font-medium">Nota<input name="notes" maxLength={1000} placeholder="Ej. Retiro semanal" className="mt-1 min-h-12 w-full rounded-xl border border-manta bg-white px-3" /></label>
            </div>
            <button className="min-h-12 rounded-full bg-anil-600 px-6 font-semibold text-white">Registrar retiro pendiente al BAC</button>
          </form>
        ) : <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm text-tinta-suave">No hay pagos PayPal completados pendientes de conciliación.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-anil-800">Retiros registrados</h2>
        {settlements?.length ? (
          <ul className="space-y-3">
            {settlements.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-semibold">{money(s.net_amount_cents)} netos → BAC</p><p className="mt-1 text-xs text-tinta-suave">Bruto {money(s.gross_amount_cents)} · comisiones {money(s.fee_amount_cents)} · iniciado {date(s.initiated_at)}</p>{s.provider_reference ? <p className="mt-1 text-xs">Ref. PayPal: {s.provider_reference}</p> : null}{s.deposited_at ? <p className="mt-1 text-xs">Depositado: {date(s.deposited_at)}</p> : null}{s.notes ? <p className="mt-1 text-xs text-tinta-suave">{s.notes}</p> : null}</div>
                  <span className="rounded-full border border-manta px-3 py-1 text-xs font-semibold">{s.status === "completed" ? "Conciliado ✓" : s.status === "cancelled" ? "Cancelado" : "Pendiente BAC"}</span>
                </div>
                {s.status === "pending" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={completeSettlement}><input type="hidden" name="settlementId" value={s.id} /><button className="min-h-10 rounded-full bg-balsamo-500 px-4 font-semibold text-white">Marcar recibido en BAC</button></form>
                    <form action={cancelSettlement}><input type="hidden" name="settlementId" value={s.id} /><button className="min-h-10 rounded-full border border-manta px-4 font-semibold">Cancelar conciliación</button></form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-tinta-suave">Todavía no hay retiros conciliados.</p>}
      </section>
    </div>
  );
}
