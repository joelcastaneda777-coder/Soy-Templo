import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

const modules = [
  { href: "/admin/radio", title: "Radio", description: "Señal 24/7, programas, episodios y parrilla." },
  { href: "/admin/eventos", title: "Eventos", description: "Agenda, categorías, cupos y publicaciones." },
  { href: "/admin/anuncios", title: "Anuncios", description: "Contenido destacado y comunicaciones." },
  { href: "/admin/planes", title: "Planes", description: "Planes bíblicos, acceso y contenido." },
  { href: "/admin/plus", title: "Soy Templo+", description: "Suscripciones, accesos y contenido premium." },
  { href: "/admin/donaciones", title: "Donaciones", description: "Pagos, conciliación PayPal y BAC." },
  { href: "/admin/cuidado", title: "Cuidado", description: "Oración, seguimiento y atención pastoral." },
  { href: "/admin/usuarios", title: "Usuarios", description: "Roles y administración de cuentas." },
];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [devotionals, plans, events, prayers, radioPrograms, unsettledPayments] = await Promise.all([
    supabase.from("devotionals").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("bible_plans").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", now).eq("status", "published"),
    supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("radio_programs").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("payment_transactions").select("id", { count: "exact", head: true }).eq("status", "completed").is("settlement_id", null),
  ]);

  const stats = [
    { label: "Devocionales publicados", value: devotionals.count ?? 0 },
    { label: "Planes activos", value: plans.count ?? 0 },
    { label: "Eventos próximos", value: events.count ?? 0 },
    { label: "Programas de radio", value: radioPrograms.count ?? 0 },
    { label: "Peticiones por moderar", value: prayers.count ?? 0, href: "/admin/cuidado", highlight: true },
    { label: "Pagos por conciliar", value: unsettledPayments.count ?? 0, href: "/admin/donaciones", highlight: true },
  ];

  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_15%_20%,rgba(82,143,143,0.25),transparent_34%),linear-gradient(145deg,#063547,#084B53_46%,#021F25)] p-6 text-white shadow-[0_20px_50px_rgba(1,63,74,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Centro de gestión</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Panel Soy Templo</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">
          Administra contenido, comunidad, Radio, Soy Templo+, eventos y conciliación desde un solo lugar.
        </p>
      </div>

      <section aria-labelledby="admin-summary-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tinta-suave">Resumen</p>
            <h2 id="admin-summary-title" className="font-display text-2xl font-semibold text-anil-800">Lo que requiere atención</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {stats.map((stat) => {
            const content = (
              <Card className={stat.highlight && stat.value > 0 ? "h-full border-cirio-500" : "h-full"}>
                <p className="font-display text-3xl font-bold text-anil-800">{stat.value}</p>
                <p className="mt-1 text-sm text-tinta-suave">{stat.label}</p>
                {stat.href ? <p className="mt-3 text-xs font-semibold text-anil-600">Gestionar →</p> : null}
              </Card>
            );
            return stat.href ? <Link key={stat.label} href={stat.href}>{content}</Link> : <div key={stat.label}>{content}</div>;
          })}
        </div>
      </section>

      <section aria-labelledby="admin-modules-title" className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tinta-suave">Módulos</p>
          <h2 id="admin-modules-title" className="font-display text-2xl font-semibold text-anil-800">Administración rápida</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className="group">
              <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#2d7777]/45 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-anil-900">{module.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{module.description}</p>
                  </div>
                  <span className="text-lg text-[#0a5a5e] transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
