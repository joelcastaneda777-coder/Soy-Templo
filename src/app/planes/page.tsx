import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";

export const metadata: Metadata = { title: "Planes bíblicos" };
export const revalidate = 300;

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("bible_plans")
    .select("slug, name, description, duration_days, level, topic, access_tier")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <PageHero title={t.nav.plans} />
      {plans?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {plans.map((plan, i) => (
            <li key={plan.slug} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <Link href={`/planes/${plan.slug}`}>
                <Card className="h-full transition-colors hover:border-anil-300">
                  <div className="flex flex-wrap gap-2">
                    {plan.access_tier === "plus" ? <Badge tone="anil">Soy Templo+</Badge> : null}
                    <Badge tone="anil">{plan.duration_days} {t.plans.days}</Badge>
                    <Badge tone="balsamo">{t.plans.level[plan.level] ?? plan.level}</Badge>
                    {plan.topic ? <Badge>{plan.topic}</Badge> : null}
                  </div>
                  <h2 className="mt-3 font-display text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-1 line-clamp-3 text-sm text-tinta-suave">{plan.description}</p>
                  {plan.access_tier === "plus" ? (
                    <p className="mt-3 text-xs font-semibold text-anil-600">Plan especializado · requiere Soy Templo+</p>
                  ) : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t.plans.empty} />
      )}
    </div>
  );
}
