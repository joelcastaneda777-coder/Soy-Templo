import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { PrayerForm } from "./prayer-form";
import { CareRequestForm } from "./care-request-form";
import { PrayingButton } from "./praying-button";

export const metadata: Metadata = { title: "Oración y cuidado" };

const categoryLabels: Record<string, string> = {
  salud: "Salud",
  familia: "Familia",
  provision: "Provisión",
  duelo: "Duelo",
  espiritual: "Vida espiritual",
  trabajo: "Trabajo / estudios",
  gratitud: "Gratitud",
  general: "General",
};

type CareType = "counseling" | "hospital_visit" | "home_visit";

const careOptions: Array<{
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}> = [
  { href: "#pedir-oracion", eyebrow: "Comunidad", title: "Pedir oración", description: "Comparte una necesidad en privado o pide que la comunidad ore contigo después de moderación." },
  { href: "?tipo=counseling#acompanamiento", eyebrow: "Confidencial", title: "Consejería pastoral", description: "Solicita una conversación y acompañamiento espiritual con el equipo de cuidado." },
  { href: "?tipo=hospital_visit#acompanamiento", eyebrow: "Visitación", title: "Visita hospitalaria", description: "Coordina una visita de oración y acompañamiento para una persona hospitalizada." },
  { href: "?tipo=home_visit#acompanamiento", eyebrow: "Plantadores", title: "Visita en casa", description: "Pide que nuestro equipo de Plantadores visite un hogar para escuchar, orar y acompañar." },
];

function toCareType(value?: string): CareType {
  if (value === "hospital_visit" || value === "home_visit") return value;
  return "counseling";
}

export default async function PrayerPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: prayers }] = await Promise.all([
    user ? supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("prayer_requests").select("id, body, category, is_anonymous, status, created_at, prayer_interactions(count)").eq("is_public", true).in("status", ["approved", "answered"]).order("created_at", { ascending: false }).limit(20),
  ]);

  const defaultName = profile?.full_name ?? (user?.user_metadata?.full_name as string | undefined) ?? "";
  const defaultPhone = profile?.phone ?? "";
  const defaultEmail = user?.email ?? "";

  return (
    <div className="space-y-8">
      <PageHero
        title="Oración y cuidado"
        subtitle="No tienes que atravesar todo a solas. Podemos orar contigo y, cuando lo necesites, acompañarte de manera personal."
        variant="abyssal"
      />

      <div className="mx-auto max-w-3xl space-y-9">
        <section aria-label="Opciones de oración y cuidado" className="grid gap-3 sm:grid-cols-2">
          {careOptions.map((option) => (
            <Link key={option.title} href={option.href} scroll>
              <Card className="h-full transition-colors hover:border-anil-300">
                <p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">{option.eyebrow}</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-anil-800">{option.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{option.description}</p>
                <p className="mt-4 text-sm font-semibold text-anil-600">Solicitar →</p>
              </Card>
            </Link>
          ))}
        </section>

        {user ? (
          <div className="flex justify-end">
            <Link href="/oracion/mis-solicitudes" className="rounded-full border border-manta px-4 py-2 text-sm font-semibold text-anil-600 hover:border-anil-300">Mis solicitudes</Link>
          </div>
        ) : null}

        <PrayerForm />

        <section id="acompanamiento" className="scroll-mt-24">
          <CareRequestForm initialType={toCareType(tipo)} defaultName={defaultName} defaultPhone={defaultPhone} defaultEmail={defaultEmail} />
        </section>

        <section className="rounded-[var(--radius-card)] border border-manta bg-manta/35 p-5">
          <h2 className="font-display text-lg font-semibold text-anil-800">Dos espacios, una misma comunidad</h2>
          <div className="mt-3 grid gap-4 text-sm leading-relaxed text-tinta-suave sm:grid-cols-2">
            <p><strong className="text-tinta">Muro de oración:</strong> puedes pedir que una petición sea compartida. Solo se publica después de revisión y nunca mostramos tus datos de contacto.</p>
            <p><strong className="text-tinta">Cuidado confidencial:</strong> consejería, hospital y visitas en casa no se publican. Solo acceden quienes necesitan gestionar o atender el caso.</p>
          </div>
        </section>

        <section aria-label="Peticiones públicas" className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-balsamo-700">Muro de oración</p>
            <h2 className="font-display text-2xl font-semibold text-anil-800">Oremos juntos</h2>
          </div>
          {prayers?.length ? prayers.map((prayer, i) => {
            const prayingCount = prayer.prayer_interactions?.[0]?.count ?? 0;
            return (
              <Card key={prayer.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="anil">{categoryLabels[prayer.category] ?? prayer.category}</Badge>
                  {prayer.status === "answered" ? <Badge tone="balsamo">Respondida 🙌</Badge> : null}
                  {prayer.is_anonymous ? <Badge>Anónima</Badge> : null}
                </div>
                <p className="mt-3 leading-relaxed">{prayer.body}</p>
                <div className="mt-4 flex items-center gap-3">
                  <PrayingButton prayerId={prayer.id} isLoggedIn={!!user} />
                  {prayingCount > 0 ? <span className="text-sm text-tinta-suave">{prayingCount} {t.prayer.prayingCount}</span> : null}
                </div>
              </Card>
            );
          }) : <EmptyState title={t.prayer.empty} />}
        </section>
      </div>
    </div>
  );
}
