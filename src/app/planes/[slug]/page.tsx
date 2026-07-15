import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n/es";
import { PlanLessons } from "./plan-lessons";

export default async function PlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("bible_plans")
    .select("*, bible_plan_lessons(id, position, title, bible_reading, explanation, questions, activity, prayer)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!plan) notFound();

  const lessons = [...(plan.bible_plan_lessons ?? [])].sort((a, b) => a.position - b.position);

  const { data: { user } } = await supabase.auth.getUser();
  let completedLessons: string[] = [];
  let hasStarted = false;

  if (user) {
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
          <Badge tone="anil">{plan.duration_days} {t.plans.days}</Badge>
          <Badge tone="balsamo">{t.plans.level[plan.level] ?? plan.level}</Badge>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-anil-800">{plan.name}</h1>
        <p className="mt-2 leading-relaxed text-tinta-suave">{plan.description}</p>
      </header>

      <PlanLessons
        planId={plan.id}
        lessons={lessons}
        initialCompleted={completedLessons}
        hasStarted={hasStarted}
        isLoggedIn={!!user}
      />
    </div>
  );
}
