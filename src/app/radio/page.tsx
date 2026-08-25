import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";
import { RadioPlayer } from "./radio-player";

export const metadata: Metadata = { title: t.radio.title };

type RadioSettings = { name?: string; description?: string; stream_url?: string | null };

export default async function RadioPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle();
  const radio = (data?.value as RadioSettings | null) ?? {};

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-anil-800">
          {radio.name || t.radio.title}
        </h1>
        {radio.description ? (
          <p className="mt-2 text-tinta-suave">{radio.description}</p>
        ) : null}
      </header>

      <RadioPlayer streamUrl={radio.stream_url ?? null} stationName={radio.name || t.radio.title} />
    </div>
  );
}
