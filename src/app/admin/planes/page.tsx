import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PlanImportForm } from "./import-form";
import { updatePlanAppearance } from "./actions";

export const metadata: Metadata = { title: "Planes de estudio · Panel" };

const THEMES = [
  ["faith", "Fe"],
  ["fear", "Miedo"],
  ["hope", "Esperanza"],
  ["sadness", "Tristeza"],
  ["joy", "Gozo"],
  ["grace", "Gracia"],
  ["identity", "Identidad"],
  ["wisdom", "Sabiduría"],
  ["rest", "Descanso"],
  ["theology", "Teología"],
] as const;

export default async function AdminPlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("bible_plans")
    .select("id,slug,name,duration_days,level,topic,status,created_at,visual_theme,accent_color,cover_image_url,access_tier")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-5xl space-y-7">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Planes de estudio</h1>
        <p className="mt-1 text-sm text-tinta-suave">Publica estudios completos y define la identidad visual de cada recorrido.</p>
      </div>

      <PlanImportForm />

      {plans?.length ? (
        <div className="space-y-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-anil-800">Apariencia de los planes</h2>
            <p className="mt-1 text-sm text-tinta-suave">El tema, color e imagen se usan en el carrusel inmersivo de /planes.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <form
                key={plan.id}
                action={updatePlanAppearance}
                className="overflow-hidden rounded-[var(--radius-card)] border border-manta bg-white dark:bg-manta"
              >
                <input type="hidden" name="planId" value={plan.id} />
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: plan.accent_color || "#5B5FEF" }}
                  aria-hidden="true"
                />
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{plan.name}</strong>
                      {plan.access_tier === "plus" ? (
                        <span className="rounded-full bg-cirio-500 px-2 py-0.5 text-[10px] font-bold text-anil-900">Soy Templo+</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-tinta-suave">{plan.duration_days} días · {plan.topic || "Sin tema"}</p>
                  </div>

                  <label className="block text-xs font-semibold text-tinta-suave">
                    Tema visual
                    <select
                      name="visualTheme"
                      defaultValue={plan.visual_theme || "faith"}
                      className="mt-1 w-full rounded-xl border border-manta bg-papel px-3 py-2 text-sm text-tinta"
                    >
                      {THEMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-tinta-suave">
                    Color de acento
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        name="accentColor"
                        defaultValue={plan.accent_color || "#5B5FEF"}
                        className="h-10 w-14 rounded-lg border border-manta bg-papel p-1"
                      />
                      <span className="text-xs text-tinta-suave">Se usa en luz, etiqueta y navegación.</span>
                    </div>
                  </label>

                  <label className="block text-xs font-semibold text-tinta-suave">
                    Imagen de portada
                    <input
                      type="text"
                      name="coverImageUrl"
                      defaultValue={plan.cover_image_url || ""}
                      placeholder="/plans/imagen.jpg o https://..."
                      className="mt-1 w-full rounded-xl border border-manta bg-papel px-3 py-2 text-sm text-tinta"
                    />
                    <span className="mt-1 block text-[11px] font-normal text-tinta-suave">Por ahora admite una ruta o URL. Más adelante podemos conectarlo a subida directa de archivos.</span>
                  </label>

                  <button type="submit" className="rounded-full bg-anil-700 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                    Guardar apariencia
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
