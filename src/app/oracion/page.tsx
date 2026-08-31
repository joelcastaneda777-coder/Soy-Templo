import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { t } from "@/lib/i18n/es";
import { PrayerForm } from "./prayer-form";
import { CareRequestForm } from "./care-request-form";
import { PrayingButton } from "./praying-button";

export const metadata: Metadata = { title: "Oración y cuidado" };

const categoryLabels: Record<string, string> = { salud: "Salud", familia: "Familia", provision: "Provisión", duelo: "Duelo", espiritual: "Vida espiritual", trabajo: "Trabajo / estudios", gratitud: "Gratitud", general: "General" };
type CareType = "counseling" | "hospital_visit" | "home_visit";

const careOptions = [
  { href: "#pedir-oracion", eyebrow: "Comunidad", title: "Pedir oración", description: "Comparte una necesidad en privado o pide que la comunidad ore contigo después de moderación.", icon: "✦" },
  { href: "?tipo=counseling#acompanamiento", eyebrow: "Confidencial", title: "Consejería pastoral", description: "Solicita una conversación y acompañamiento espiritual con el equipo de cuidado.", icon: "◌" },
  { href: "?tipo=hospital_visit#acompanamiento", eyebrow: "Visitación", title: "Visita hospitalaria", description: "Coordina una visita de oración y acompañamiento para una persona hospitalizada.", icon: "+" },
  { href: "?tipo=home_visit#acompanamiento", eyebrow: "Plantadores", title: "Visita en casa", description: "Pide que nuestro equipo visite un hogar para escuchar, orar y acompañar.", icon: "⌂" },
];

function toCareType(value?: string): CareType { if (value === "hospital_visit" || value === "home_visit") return value; return "counseling"; }

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
    <div className="space-y-7">
      <PageHero title="Oración y cuidado" subtitle="Un espacio para pedir oración, acompañamiento y cuidado pastoral con calma y privacidad." variant="editorial" />

      <div className="mx-auto max-w-4xl space-y-9">
        <section aria-label="Opciones de oración y cuidado" className="grid gap-3 sm:grid-cols-2">
          {careOptions.map((option, index) => (
            <Link key={option.title} href={option.href} scroll className={index === 0 ? "sm:col-span-2" : ""}>
              <article className={`group relative h-full overflow-hidden rounded-[1.8rem] border border-[#063F47]/10 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#0A6A68]/35 ${index === 0 ? "min-h-44 bg-[radial-gradient(circle_at_88%_18%,rgba(255,255,255,.9),transparent_28%),linear-gradient(145deg,#D9EFE4,#BDDDD0)] shadow-[0_20px_44px_rgba(6,63,71,.1)] sm:p-7" : "bg-white/68 shadow-[0_12px_30px_rgba(6,63,71,.07)] backdrop-blur-xl"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">{option.eyebrow}</p>
                    <h2 className={`${index === 0 ? "text-3xl" : "text-xl"} mt-2 font-display font-semibold tracking-[-.02em] text-[#063F47]`}>{option.title}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#063F47]/62">{option.description}</p>
                  </div>
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/48 text-lg font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">{option.icon}</span>
                </div>
                <p className="mt-5 text-sm font-semibold text-[#063F47]">Solicitar <span className="inline-block transition-transform group-hover:translate-x-1">→</span></p>
              </article>
            </Link>
          ))}
        </section>

        {user ? <div className="flex justify-end"><Link href="/oracion/mis-solicitudes" className="rounded-full border border-[#063F47]/10 bg-white/60 px-4 py-2 text-sm font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">Mis solicitudes</Link></div> : null}

        <section id="pedir-oracion" className="scroll-mt-24 rounded-[2rem] border border-[#063F47]/10 bg-white/66 p-5 shadow-[0_16px_38px_rgba(6,63,71,.07)] backdrop-blur-xl sm:p-6"><PrayerForm /></section>

        <section id="acompanamiento" className="scroll-mt-24 rounded-[2rem] border border-[#063F47]/10 bg-white/66 p-5 shadow-[0_16px_38px_rgba(6,63,71,.07)] backdrop-blur-xl sm:p-6">
          <CareRequestForm initialType={toCareType(tipo)} defaultName={defaultName} defaultPhone={defaultPhone} defaultEmail={defaultEmail} />
        </section>

        <section className="rounded-[1.8rem] border border-[#063F47]/10 bg-[linear-gradient(145deg,#063F47,#0A5559)] p-6 text-white shadow-[0_18px_42px_rgba(6,63,71,.14)]">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/55">Privacidad</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Dos espacios, una misma comunidad</h2>
          <div className="mt-4 grid gap-4 text-sm leading-relaxed text-white/68 sm:grid-cols-2">
            <p><strong className="text-white">Muro de oración:</strong> puedes pedir que una petición sea compartida. Solo se publica después de revisión.</p>
            <p><strong className="text-white">Cuidado confidencial:</strong> consejería y visitas no se publican; solo accede el equipo necesario.</p>
          </div>
        </section>

        <section aria-label="Peticiones públicas" className="space-y-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#0A6A68]">Muro de oración</p><h2 className="mt-1 font-display text-3xl font-semibold tracking-[-.02em] text-[#063F47]">Oremos juntos</h2></div>
          {prayers?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">{prayers.map((prayer, i) => {
              const prayingCount = prayer.prayer_interactions?.[0]?.count ?? 0;
              return <article key={prayer.id} className="stagger-item rounded-[1.7rem] border border-[#063F47]/10 bg-white/68 p-5 shadow-[0_12px_30px_rgba(6,63,71,.06)] backdrop-blur-xl" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex flex-wrap items-center gap-2"><Badge tone="anil">{categoryLabels[prayer.category] ?? prayer.category}</Badge>{prayer.status === "answered" ? <Badge tone="balsamo">Respondida 🙌</Badge> : null}{prayer.is_anonymous ? <Badge>Anónima</Badge> : null}</div>
                <p className="mt-3 leading-relaxed text-[#163D3D]">{prayer.body}</p>
                <div className="mt-4 flex items-center gap-3"><PrayingButton prayerId={prayer.id} isLoggedIn={!!user} />{prayingCount > 0 ? <span className="text-sm text-[#063F47]/55">{prayingCount} {t.prayer.prayingCount}</span> : null}</div>
              </article>;
            })}</div>
          ) : <EmptyState title={t.prayer.empty} />}
        </section>
      </div>
    </div>
  );
}
