import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CampaignPushForm } from "./campaign-push-form";

export const metadata: Metadata = { title: "Notificaciones · Panel" };

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("donation_categories")
    .select("slug, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Notificaciones de campaña</h1>
        <p className="mt-2 text-sm text-tinta-suave">
          Envía un aviso push a quienes tengan activada la categoría &quot;Campañas de donación&quot;.
          Úsalo con moderación — llega directo al teléfono de las personas.
        </p>
      </div>
      <CampaignPushForm categories={categories ?? []} />
    </div>
  );
}
