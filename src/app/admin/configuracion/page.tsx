import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { saveSiteIdentity } from "./actions";

export const metadata: Metadata = { title: "Configuración · Panel" };

function StatusPill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const cls = tone === "ok"
    ? "border-emerald-300/60 bg-emerald-100/70 text-emerald-800"
    : tone === "warn"
      ? "border-amber-300/60 bg-amber-100/75 text-amber-800"
      : "border-white/15 bg-white/[0.07] text-white/70";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em] ${cls}`}>{children}</span>;
}

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: roles }, { data: identityRow }, { data: radioRow }, { data: plusRows }] = await Promise.all([
    user ? supabase.from("user_roles").select("role").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    supabase.from("app_settings").select("value,updated_at").eq("key", "site_identity").maybeSingle(),
    supabase.from("app_settings").select("value").eq("key", "radio").maybeSingle(),
    supabase.from("plus_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const isAdmin = (roles ?? []).some((item) => item.role === "admin" || item.role === "superadmin");
  if (!isAdmin) return <p className="rounded-3xl border border-manta bg-white p-5 text-sm">No tienes permiso para administrar la configuración global.</p>;

  const identity = (identityRow?.value as {
    church_name?: string; app_name?: string; support_email?: string | null; phone?: string | null; address?: string | null; website?: string | null;
  } | null) ?? {};
  const radio = (radioRow?.value as { stream_url?: string | null } | null) ?? {};
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const pushConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  const paypalConfigured = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const radioConfigured = Boolean(radio.stream_url);

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[2rem] border border-[#063F47]/10 bg-[radial-gradient(circle_at_15%_15%,rgba(116,217,205,.18),transparent_30%),linear-gradient(145deg,#063F47,#0A5960_58%,#022B31)] p-6 text-white shadow-[0_28px_70px_rgba(2,43,49,.18)] md:p-8">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/60">Sistema</p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold">Configuración</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72">Controla la identidad, integraciones, seguridad y comportamiento general de Soy Templo desde un solo lugar.</p>
          </div>
          <StatusPill tone="ok">Panel operativo</StatusPill>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#0A5A5E]">Salud de Soy Templo</p>
            <h2 className="font-display text-2xl font-semibold text-[#063F47]">Estado del sistema</h2>
          </div>
          <span className="text-xs text-tinta-suave">Comprobación desde configuración activa</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HealthCard title="Supabase" description="Base de datos, autenticación y permisos" status={supabaseConfigured ? "Conectado" : "Revisar"} ok={supabaseConfigured} />
          <HealthCard title="Acceso de servidor" description="Operaciones administrativas sensibles" status={serviceRoleConfigured ? "Configurado" : "Revisar"} ok={serviceRoleConfigured} />
          <HealthCard title="Push" description="Notificaciones web y PWA" status={pushConfigured ? "Configurado" : "Pendiente"} ok={pushConfigured} />
          <HealthCard title="Radio 24/7" description="Señal de transmisión principal" status={radioConfigured ? "Enlazada" : "Pendiente"} ok={radioConfigured} />
          <HealthCard title="PayPal" description="Donaciones institucionales" status={paypalConfigured ? "Conectado" : "Pendiente"} ok={paypalConfigured} />
          <HealthCard title="Soy Templo+" description="Derechos premium y suscripciones" status={`${plusRows?.length ?? 0} activas`} ok />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 rounded-[2rem] border border-[#063F47]/10 bg-white/80 p-5 shadow-[0_18px_48px_rgba(6,63,71,.08)] backdrop-blur-xl md:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#0A5A5E]">Identidad</p>
            <h2 className="font-display text-2xl font-semibold text-[#063F47]">Marca y datos institucionales</h2>
            <p className="mt-1 text-sm text-tinta-suave">Estos datos sirven como fuente central para futuras pantallas, correos y tiendas móviles.</p>
          </div>
          <form action={saveSiteIdentity} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre de la iglesia" name="churchName" defaultValue={identity.church_name || "Soy Templo Internacional"} required />
            <Field label="Nombre de la app" name="appName" defaultValue={identity.app_name || "Soy Templo"} required />
            <Field label="Correo de soporte" name="supportEmail" type="email" defaultValue={identity.support_email || ""} />
            <Field label="Teléfono" name="phone" defaultValue={identity.phone || ""} />
            <Field label="Sitio web" name="website" type="url" defaultValue={identity.website || ""} />
            <Field label="Dirección" name="address" defaultValue={identity.address || ""} />
            <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-tinta-suave">Los secretos y claves privadas nunca se muestran en este panel.</p>
              <button className="min-h-11 rounded-full bg-[#063F47] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(6,63,71,.18)] transition active:scale-[.98]">Guardar identidad</button>
            </div>
          </form>
        </div>

        <div className="xl:col-span-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ConfigCard eyebrow="Experiencia" title="Inicio y módulos" description="Orden, visibilidad y comportamiento de los bloques principales." href="/admin" status="Activo" />
          <ConfigCard eyebrow="Comunicación" title="Notificaciones" description="Push, categorías y envíos administrativos." href="/admin/notificaciones" status={pushConfigured ? "Configurado" : "Pendiente"} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ConfigCard eyebrow="Pagos" title="Donaciones" description="Proveedor, conciliación y categorías institucionales." href="/admin/donaciones" status={paypalConfigured ? "PayPal conectado" : "PayPal pendiente"} />
        <ConfigCard eyebrow="Premium" title="Soy Templo+" description="Acceso premium, precios e integración futura del proveedor de cobro." href="/admin/plus" status="Preparado" />
        <ConfigCard eyebrow="Audio" title="Radio" description="Stream principal, programación y archivo bajo demanda." href="/admin/radio" status={radioConfigured ? "Stream activo" : "Falta stream"} />
        <ConfigCard eyebrow="Multimedia" title="Archivos y almacenamiento" description="Audio, video, límites de subida y futura CDN de contenido." href="/admin/radio" status="Supabase listo" />
        <ConfigCard eyebrow="Acceso" title="Usuarios y seguridad" description="Roles, cuentas, verificación y privilegios administrativos." href="/admin/usuarios" status="RLS activo" />
        <ConfigCard eyebrow="Apps" title="PWA, Android e iOS" description="Versión web instalada y preparación para Play Store / App Store." href="/admin" status="En preparación" />
      </section>

      <section className="rounded-[2rem] border border-[#063F47]/12 bg-[linear-gradient(135deg,rgba(6,63,71,.98),rgba(8,79,86,.92))] p-5 text-white md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">Integraciones</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Centro de conexiones</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/68">Supabase, Vercel, Push, Radio y pagos se mantienen desacoplados para poder cambiar proveedores sin rehacer la app.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={supabaseConfigured ? "ok" : "warn"}>Supabase</StatusPill>
            <StatusPill tone={pushConfigured ? "ok" : "warn"}>Push</StatusPill>
            <StatusPill tone={radioConfigured ? "ok" : "warn"}>Radio</StatusPill>
            <StatusPill tone={paypalConfigured ? "ok" : "warn"}>PayPal</StatusPill>
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthCard({ title, description, status, ok }: { title: string; description: string; status: string; ok: boolean }) {
  return (
    <div className="rounded-[1.6rem] border border-[#063F47]/10 bg-[linear-gradient(145deg,rgba(255,255,255,.86),rgba(227,243,235,.72))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_12px_32px_rgba(6,63,71,.06)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-display text-lg font-semibold text-[#063F47]">{title}</h3><p className="mt-1 text-xs leading-relaxed text-tinta-suave">{description}</p></div>
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden />
      </div>
      <p className={`mt-4 text-xs font-bold uppercase tracking-[.12em] ${ok ? "text-emerald-700" : "text-amber-700"}`}>{status}</p>
    </div>
  );
}

function ConfigCard({ eyebrow, title, description, href, status }: { eyebrow: string; title: string; description: string; href: string; status: string }) {
  return (
    <Link href={href} className="group block rounded-[1.7rem] border border-[#063F47]/10 bg-white/74 p-5 shadow-[0_14px_38px_rgba(6,63,71,.07)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#2D7777]/35">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#0A5A5E]">{eyebrow}</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-[#063F47]">{title}</h3>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#063F47]/10 bg-[#E5F2EC] text-[#063F47] transition group-hover:translate-x-0.5">→</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-tinta-suave">{description}</p>
      <span className="mt-4 inline-flex rounded-full bg-[#063F47]/[.06] px-3 py-1 text-xs font-semibold text-[#0A5A5E]">{status}</span>
    </Link>
  );
}

function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-[#063F47]">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} className="mt-1.5 min-h-11 w-full rounded-2xl border border-[#063F47]/12 bg-[#F7FCF9]/90 px-3.5 font-normal text-tinta outline-none transition focus:border-[#2D7777]/50 focus:ring-2 focus:ring-[#2D7777]/10" /></label>;
}
