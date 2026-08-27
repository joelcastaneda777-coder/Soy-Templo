import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { getPlusAccess } from "@/lib/plus/access";
import { RadioPlayer } from "./radio-player";

export const metadata: Metadata = { title: t.radio.title };

type RadioSettings = { name?: string; description?: string; stream_url?: string | null };

export default async function RadioPage() {
  const supabase = await createClient();
  const [{ data }, access] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
    getPlusAccess(),
  ]);
  const radio = (data?.value as RadioSettings | null) ?? {};

  return (
    <div className="space-y-6">
      <PageHero title={radio.name || t.radio.title} subtitle={radio.description} />

      <div className="mx-auto max-w-lg py-4">
        <RadioPlayer
          streamUrl={radio.stream_url ?? null}
          stationName={radio.name || t.radio.title}
          hasBackgroundAccess={access.hasAccess}
        />
      </div>
    </div>
  );
}
