import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { PlanGallery } from "./plan-gallery";

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
        <PlanGallery plans={plans} />
      ) : (
        <EmptyState title={t.plans.empty} />
      )}
    </div>
  );
}
