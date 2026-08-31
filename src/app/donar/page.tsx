import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { paymentProviderStatus } from "@/lib/payments";
import { DonationForm } from "./donation-form";

export const metadata: Metadata = { title: "Donaciones" };

export default async function DonatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("donation_categories").select("id, name, slug").eq("is_active", true).order("name");
  const payment = paymentProviderStatus();
  const onlineEnabled = payment.configured && payment.name === "paypal";

  return (
    <div className="space-y-6">
      <PageHero title="Dar con propósito" subtitle="Generosidad que sostiene comunidad, misión y cuidado." variant="editorial" />

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-[1.05fr_.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#063F47]/10 bg-[radial-gradient(circle_at_82%_12%,rgba(255,255,255,.9),transparent_28%),linear-gradient(145deg,#D8EEE3,#BDDCCF)] p-6 shadow-[0_22px_52px_rgba(6,63,71,.11)] md:p-7">
          <span aria-hidden className="absolute -right-9 -top-9 h-28 w-28 rounded-full border border-white/55 bg-white/20 backdrop-blur-xl" />
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#0A6A68]">Donación institucional</p>
            <h2 className="mt-3 max-w-sm font-display text-3xl font-semibold leading-tight tracking-[-.025em] text-[#063F47]">Una forma sencilla de sostener lo que hacemos juntos.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#063F47]/65">Selecciona el destino de tu aporte. Donaciones y Soy Templo+ permanecen completamente separados: donar nunca desbloquea contenido premium.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[1.4rem] border border-white/60 bg-white/38 p-4 backdrop-blur-xl"><p className="font-semibold text-[#063F47]">Transparencia</p><p className="mt-1 text-xs leading-relaxed text-[#063F47]/60">Cada aporte queda asociado a una categoría.</p></div>
              <div className="rounded-[1.4rem] border border-white/60 bg-white/38 p-4 backdrop-blur-xl"><p className="font-semibold text-[#063F47]">Privacidad</p><p className="mt-1 text-xs leading-relaxed text-[#063F47]/60">Puedes donar de manera anónima.</p></div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#063F47]/10 bg-white/72 p-5 shadow-[0_16px_42px_rgba(6,63,71,.08)] backdrop-blur-xl md:p-6">
          <DonationForm categories={categories ?? []} onlineEnabled={onlineEnabled} />
        </section>

        <div className="md:col-span-2 rounded-[1.6rem] border border-[#063F47]/10 bg-white/52 p-4 text-sm leading-relaxed text-[#063F47]/62 shadow-sm backdrop-blur-xl">
          <p>{t.donate.bank}</p>
          <p className="mt-2 text-xs">{onlineEnabled ? "Los pagos en línea se procesan mediante PayPal. Soy Templo no almacena datos de tarjetas." : "El pago en línea todavía no está habilitado. Puedes utilizar las opciones institucionales disponibles mientras se completa la conexión de PayPal."}</p>
        </div>
      </div>
    </div>
  );
}
