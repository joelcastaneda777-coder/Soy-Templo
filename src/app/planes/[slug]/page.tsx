import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PlusGate } from "@/components/plus/plus-gate";
import { getPlusAccess } from "@/lib/plus/access";
import { t } from "@/lib/i18n/es";
import { PlanLessons } from "./plan-lessons";

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: plan }, access] = await Promise.all([
    supabase
      .from("bible_plans")
      .select("*, bible_plan_lessons(id, position, title, bible_reading, explanation, questions, activity, prayer)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle(),
    getPlusAccess(),
  ]);

  if (!plan) notFound();

  const requiresPlus = plan.access_tier === "plus";
  const canOpenPlan = !requiresPlus || access.hasAccess;
  const lessons = canOpenPlan
    ? [...(plan.bible_plan_lessons ?? [])].sort((a, b) => a.position - b.position)
    : [];

  let completedLessons: string[] = [];
  let hasStarted = false;

  if (access.isLoggedIn && canOpenPlan) {
    const { data: progress } = await supabase
      .from("user_plan_progress")
      .select("completed_lessons, state")
      .eq("plan_id", plan.id)
      .maybeSingle();
    completedLessons = progress?.completed_lessons ?? [];
    hasStarted = !!progress;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <div className="flex flex-wrap gap-2">
          {requiresPlus ? <Badge tone="anil">Soy Templo+</Badge> : null}
          <Badge tone="anil">{plan.duration_days} {t.plans.days}</Badge>
          <Badge tone="balsamo">{t.plans.level[plan.level] ?? plan.level}</Badge>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-anil-800">{plan.name}</h1>
        <p className="mt-2 leading-relaxed text-tinta-suave">{plan.description}</p>
      </header>

      {canOpenPlan ? (
        <PlanLessons
          planId={plan.id}
          lessons={lessons}
          initialCompleted={completedLessons}
          hasStarted={hasStarted}
          isLoggedIn={access.isLoggedIn}
        />
      ) : (
        <PlusGate
          title="Plan especializado de Soy Templo+"
          description="Puedes conocer el tema y la duración de este plan, pero sus lecciones completas están reservadas para miembros de Soy Templo+."
        />
      )}
    </div>
  );
}
