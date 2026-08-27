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

export default async function PlusPage() {
  const access = await getPlusAccess();

  return (
    <div className="space-y-6">
      <PageHero
        title="Soy Templo+"
        subtitle="Más profundidad, más herramientas y una forma sostenible de apoyar el desarrollo de la app."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        {access.hasAccess ? (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="balsamo">Acceso Plus activo</Badge>
                <h2 className="mt-3 font-display text-2xl font-semibold text-anil-900">Tu cuenta tiene Soy Templo+</h2>
              </div>
              {access.isStaff && !access.isSubscriber ? (
                <span className="text-xs text-tinta-suave">Acceso de prueba por rol de staff</span>
              ) : null}
            </div>
            {access.subscription ? (
              <div className="mt-4 grid gap-2 text-sm text-tinta-suave sm:grid-cols-2">
                <p>Estado: <strong className="text-tinta">{statusLabel(access.subscription.status)}</strong></p>
                <p>Renovación: <strong className="text-tinta">{access.subscription.auto_renewing ? "Automática" : "No automática"}</strong></p>
                {access.subscription.current_period_end ? (
                  <p className="sm:col-span-2">Periodo actual hasta: <strong className="text-tinta">{new Date(access.subscription.current_period_end).toLocaleDateString("es-SV")}</strong></p>
                ) : null}
              </div>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <span className="inline-flex rounded-full bg-anil-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Premium</span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-anil-900">Lo que incluirá Soy Templo+</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {plusBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 text-balsamo-700" aria-hidden>✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {[plusProducts.monthly, plusProducts.annual].map((product) => (
            <Card key={product.basePlanId} className="text-center">
              <p className="text-sm font-semibold text-tinta-suave">{product.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-anil-900">{product.displayPrice}</p>
              <p className="mt-2 text-xs leading-relaxed text-tinta-suave">
                Precio previsto de lanzamiento. Google Play mostrará el precio final y cualquier ajuste regional.
              </p>
            </Card>
          ))}
        </div>

        {!access.isSubscriber ? (
          <Card className="text-center">
            <h2 className="font-display text-xl font-semibold text-anil-900">Próximamente en Google Play</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-tinta-suave">
              La arquitectura de Soy Templo+ ya está preparada, pero no cobraremos nada hasta conectar la suscripción oficial de Google Play Billing y completar las pruebas de publicación.
            </p>
            {!access.isLoggedIn ? (
              <Link
                href="/auth/login?next=/plus"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-anil-600 px-6 font-semibold text-white hover:bg-anil-800"
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
