import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { paymentProviderStatus } from "@/lib/payments";
import { DonationForm } from "./donation-form";

export const metadata: Metadata = { title: "Donaciones" };

export default async function DonatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("donation_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  const payment = paymentProviderStatus();
  const onlineEnabled = payment.configured && payment.name === "paypal";

  return (
    <div className="space-y-5">
      <PageHero title={t.donate.title} subtitle={t.donate.intro} variant="abyssal" />

      <div className="mx-auto max-w-xl space-y-5">
        <div className="rounded-[1.75rem] border border-[#063547]/10 bg-white/75 p-5 shadow-[0_16px_42px_rgba(1,63,74,0.08)] backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0a5a5e]">Donación institucional</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#063547]">Dar con claridad y transparencia</h2>
          <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
            Selecciona el destino de tu donación y registra el aporte. Las donaciones se mantienen separadas de Soy Templo+ y nunca desbloquean contenido premium.
          </p>
        </div>

        <DonationForm categories={categories ?? []} onlineEnabled={onlineEnabled} />

        <div className="rounded-[1.5rem] border border-manta bg-manta/25 p-4 text-sm leading-relaxed text-tinta-suave">
          <p>{t.donate.bank}</p>
          <p className="mt-2 text-xs">
            {onlineEnabled
              ? "Los pagos en línea se procesan mediante PayPal. Soy Templo no almacena datos de tarjetas."
              : "El pago en línea todavía no está habilitado. Puedes utilizar las opciones institucionales disponibles mientras se completa la conexión de PayPal."}
          </p>
        </div>
      </div>
    </div>
  );
}
