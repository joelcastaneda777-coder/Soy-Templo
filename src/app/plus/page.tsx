import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlusAccess } from "@/lib/plus/access";
import { plusBenefits, plusProducts } from "@/lib/plus/config";

export const metadata: Metadata = { title: "Soy Templo+" };

function statusLabel(status?: string) {
  switch (status) {
    case "trialing": return "Periodo de prueba";
    case "active": return "Activa";
    case "grace_period": return "Periodo de gracia";
    case "paused": return "Pausada";
    case "canceled": return "Cancelada";
    case "expired": return "Vencida";
    default: return "Sin suscripción";
  }
}

const freeFeatures = [
  "Devocionales y contenido esencial",
  "Eventos, anuncios y vida de comunidad",
  "Señal principal de Radio Soy Templo",
  "Oración, cuidado y progreso personal",
];

export default async function PlusPage() {
  const access = await getPlusAccess();

  return (
    <div className="space-y-6">
      <PageHero
        title="Soy Templo+"
        subtitle="Más profundidad para estudiar, escuchar y crecer; sin convertir la fe en una barrera de pago."
        variant="abyssal"
      >
        <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-white/80">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">Audio ampliado</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">Planes especializados</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">Contenido offline</span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl space-y-6">
        {access.hasAccess ? (
          <Card className="overflow-hidden border-[#2d7777]/30 bg-[linear-gradient(135deg,rgba(6,53,71,0.06),rgba(6,133,98,0.08))]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge tone="balsamo">Acceso Plus activo</Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold text-anil-900">Tu cuenta tiene Soy Templo+</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-tinta-suave">
                  Ya puedes acceder al contenido premium habilitado en planes, biblioteca y Radio Soy Templo.
                </p>
              </div>
              {access.isStaff && !access.isSubscriber ? (
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-tinta-suave">Acceso de prueba por rol de staff</span>
              ) : null}
            </div>
            {access.subscription ? (
              <div className="mt-5 grid gap-2 rounded-2xl border border-white/70 bg-white/55 p-4 text-sm text-tinta-suave sm:grid-cols-2">
                <p>Estado: <strong className="text-tinta">{statusLabel(access.subscription.status)}</strong></p>
                <p>Renovación: <strong className="text-tinta">{access.subscription.auto_renewing ? "Automática" : "No automática"}</strong></p>
                {access.subscription.current_period_end ? (
                  <p className="sm:col-span-2">Periodo actual hasta: <strong className="text-tinta">{new Date(access.subscription.current_period_end).toLocaleDateString("es-SV")}</strong></p>
                ) : null}
              </div>
            ) : null}
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-tinta-suave">Soy Templo Free</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-anil-900">La experiencia esencial sigue abierta</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="text-[#0a5a5e]" aria-hidden>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-[#2d7777]/35 bg-[linear-gradient(155deg,rgba(6,53,71,0.05),rgba(6,133,98,0.08))]">
            <span className="inline-flex rounded-full bg-[#063547] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Soy Templo+</span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-anil-900">Más herramientas, no menos comunidad</h2>
            <ul className="mt-4 space-y-3">
              {plusBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 text-[#068562]" aria-hidden>✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tinta-suave">Planes previstos</p>
              <h2 className="font-display text-2xl font-semibold text-anil-900">Elige la frecuencia que te convenga</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[plusProducts.monthly, plusProducts.annual].map((product) => (
              <Card key={product.basePlanId} className="relative overflow-hidden text-center">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#063547,#068562)]" />
                <p className="text-sm font-semibold text-tinta-suave">{product.label}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-anil-900">{product.displayPrice}</p>
                {product.basePlanId === "annual" ? (
                  <p className="mt-2 text-xs font-semibold text-[#0a5a5e]">Equivale a ahorrar frente al pago mensual</p>
                ) : null}
              </Card>
            ))}
          </div>
        </div>

        {!access.isSubscriber ? (
          <Card className="text-center">
            <h2 className="font-display text-xl font-semibold text-anil-900">Suscripción en preparación</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-tinta-suave">
              La arquitectura de Soy Templo+ ya está preparada. El cobro se activará únicamente cuando la pasarela oficial esté conectada y las pruebas de suscripción hayan sido completadas.
            </p>
            {!access.isLoggedIn ? (
              <Link
                href="/auth/login?next=/plus"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#063547] px-6 font-semibold text-white transition hover:bg-[#084B53]"
              >
                Iniciar sesión
              </Link>
            ) : null}
          </Card>
        ) : null}

        <p className="text-center text-xs leading-relaxed text-tinta-suave">
          Soy Templo+ es una suscripción digital distinta de las donaciones voluntarias a la iglesia. Donar no desbloquea funciones premium.
        </p>
      </div>
    </div>
  );
}
