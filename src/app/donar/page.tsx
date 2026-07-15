import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";
import { DonationForm } from "./donation-form";

export const metadata: Metadata = { title: "Donaciones" };

export default async function DonatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("donation_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold text-anil-800">{t.donate.title}</h1>
        <p className="mt-2 leading-relaxed text-tinta-suave">{t.donate.intro}</p>
      </header>
      <DonationForm categories={categories ?? []} />
      <p className="text-sm text-tinta-suave">{t.donate.bank}</p>
      <p className="text-xs text-tinta-suave">
        Los pagos se procesan mediante un proveedor certificado. Soy Templo no almacena datos de tarjetas.
      </p>
    </div>
  );
}
