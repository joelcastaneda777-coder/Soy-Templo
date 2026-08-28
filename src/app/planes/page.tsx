import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { t } from "@/lib/i18n/es";
import { PlanGallery } from "./plan-gallery";

export const metadata: Metadata = { title: "Planes bíblicos" };
export const revalidate = 300;

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("bible_plans")
    .select("slug, name, description, cover_url, duration_days, level, topic, access_tier, theme_key")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return plans?.length ? (
    <PlanGallery plans={plans} />
  ) : (
    <div className="py-16"><EmptyState title={t.plans.empty} /></div>
  );
}
