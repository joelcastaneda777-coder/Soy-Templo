import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/es";
import { PrayerForm } from "./prayer-form";
import { PrayingButton } from "./praying-button";

export const metadata: Metadata = { title: "Peticiones de oración" };

const categoryLabels: Record<string, string> = {
  salud: "Salud", familia: "Familia", provision: "Provisión",
  gratitud: "Gratitud", general: "General",
};

export default async function PrayerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Peticiones públicas aprobadas, con conteo de "estoy orando"
  const { data: prayers } = await supabase
    .from("prayer_requests")
    .select("id, body, category, is_anonymous, status, created_at, prayer_interactions(count)")
    .eq("is_public", true)
    .in("status", ["approved", "answered"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold text-anil-800">{t.prayer.title}</h1>
        <p className="mt-2 leading-relaxed text-tinta-suave">{t.prayer.intro}</p>
      </header>

      <PrayerForm />

      <section aria-label="Peticiones públicas" className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Oremos juntos</h2>
        {prayers?.length ? (
          prayers.map((prayer) => {
            const prayingCount = prayer.prayer_interactions?.[0]?.count ?? 0;
            return (
              <Card key={prayer.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="anil">{categoryLabels[prayer.category] ?? prayer.category}</Badge>
                  {prayer.status === "answered" ? <Badge tone="balsamo">Respondida 🙌</Badge> : null}
                </div>
                {/* Nunca se expone el nombre: solo el texto aprobado por moderación */}
                <p className="mt-3 leading-relaxed">{prayer.body}</p>
                <div className="mt-4 flex items-center gap-3">
                  <PrayingButton prayerId={prayer.id} isLoggedIn={!!user} />
                  {prayingCount > 0 ? (
                    <span className="text-sm text-tinta-suave">
                      {prayingCount} {t.prayer.prayingCount}
                    </span>
                  ) : null}
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState title={t.prayer.empty} />
        )}
      </section>
    </div>
  );
}
