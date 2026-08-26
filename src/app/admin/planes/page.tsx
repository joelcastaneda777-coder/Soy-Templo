import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanImportForm } from "./import-form";

export const metadata: Metadata = { title: "Planes de estudio · Panel" };

export default async function AdminPlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("bible_plans")
    .select("id,slug,name,duration_days,level,topic,status,created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-4xl space-y-7">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Planes de estudio</h1>
        <p className="mt-1 text-sm text-tinta-suave">Publica estudios bíblicos completos por lecciones. Los usuarios pueden iniciar un plan y guardar su avance.</p>
      </div>
      <PlanImportForm />
      {plans?.length ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-anil-800">Planes publicados</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {plans.map((plan) => (
              <li key={plan.id} className="rounded-[var(--radius-card)] border border-manta bg-white p-4 dark:bg-manta">
                <strong>{plan.name}</strong>
                <p className="mt-1 text-xs text-tinta-suave">{plan.duration_days} lecciones · {plan.level} · {plan.topic || "Sin tema"}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
