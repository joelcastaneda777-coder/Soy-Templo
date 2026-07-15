import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [devotionals, plans, events, prayers] = await Promise.all([
    supabase.from("devotionals").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("bible_plans").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", new Date().toISOString()),
    supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "Devocionales publicados", value: devotionals.count ?? 0 },
    { label: "Planes activos", value: plans.count ?? 0 },
    { label: "Eventos próximos", value: events.count ?? 0 },
    { label: "Peticiones por moderar", value: prayers.count ?? 0, highlight: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-anil-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className={s.highlight && s.value > 0 ? "border-cirio-500" : undefined}>
            <p className="font-display text-3xl font-bold text-anil-800">{s.value}</p>
            <p className="mt-1 text-sm text-tinta-suave">{s.label}</p>
          </Card>
        ))}
      </div>
      <p className="text-sm text-tinta-suave">
        Las secciones de gestión (crear y editar contenido) se implementan en la Fase 3–4
        siguiendo el mismo patrón: Server Component para listar + Server Actions con validación Zod.
      </p>
    </div>
  );
}
