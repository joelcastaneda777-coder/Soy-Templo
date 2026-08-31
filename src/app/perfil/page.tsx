import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import { createClient } from "@/lib/supabase/server";
import { getPlusAccess } from "@/lib/plus/access";
import { logout } from "@/app/auth/actions";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./account-forms";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/perfil");

  const [{ data: profile }, plusAccess] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    getPlusAccess(),
  ]);
  const fullName = profile?.full_name || String(user.user_metadata?.full_name || "");
  const phone = profile?.phone || "";

  return (
    <div className="space-y-6">
      <PageHero title="Mi cuenta" subtitle="Tu perfil, seguridad, preferencias y acceso en Soy Templo." variant="editorial" />

      <div className="mx-auto max-w-3xl space-y-5">
        <section className="grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
          <div className="relative overflow-hidden rounded-[1.9rem] border border-[#063F47]/10 bg-[radial-gradient(circle_at_88%_18%,rgba(255,255,255,.9),transparent_28%),linear-gradient(145deg,#D8EEE3,#BDDCCF)] p-6 shadow-[0_20px_44px_rgba(6,63,71,.1)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/50 font-display text-2xl font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">{(fullName || user.email || "S").trim().charAt(0).toUpperCase()}</div>
              <div className="min-w-0"><p className="truncate font-display text-2xl font-semibold tracking-[-.02em] text-[#063F47]">{fullName || "Usuario Soy Templo"}</p><p className="truncate text-sm text-[#063F47]/58">{user.email}</p></div>
            </div>
          </div>

          <Link href="/plus" className="group rounded-[1.9rem] border border-[#063F47]/10 bg-[linear-gradient(145deg,#063F47,#0A5559)] p-6 text-white shadow-[0_18px_40px_rgba(6,63,71,.13)]">
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/55">Soy Templo+</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">{plusAccess.hasAccess ? "Acceso activo" : "Profundiza más"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{plusAccess.hasAccess ? "Tu contenido y funciones Plus están disponibles." : "Planes especializados, audio ampliado y más."}</p>
            <p className="mt-4 text-sm font-semibold">Ver acceso <span className="inline-block transition-transform group-hover:translate-x-1">→</span></p>
          </Link>
        </section>

        <section className="rounded-[2rem] border border-[#063F47]/10 bg-white/68 p-5 shadow-[0_15px_36px_rgba(6,63,71,.07)] backdrop-blur-xl sm:p-6"><ProfileForm fullName={fullName} phone={phone} email={user.email || ""} /></section>

        <section className="rounded-[2rem] border border-[#063F47]/10 bg-white/68 p-5 shadow-[0_15px_36px_rgba(6,63,71,.07)] backdrop-blur-xl sm:p-6">
          <div className="mb-3 px-1"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Preferencias</p><h2 className="mt-1 font-display text-2xl font-semibold text-[#063F47]">Notificaciones</h2><p className="mt-1 text-sm text-[#063F47]/58">Elige qué novedades quieres recibir en este dispositivo.</p></div>
          <NotificationSettings />
        </section>

        <section className="rounded-[2rem] border border-[#063F47]/10 bg-white/68 p-5 shadow-[0_15px_36px_rgba(6,63,71,.07)] backdrop-blur-xl sm:p-6"><PasswordForm /></section>

        <section className="space-y-3 rounded-[1.8rem] border border-[#063F47]/10 bg-[#E8F5EE]/75 p-5">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#0A6A68]">Sesión</p>
          <form action={logout}><button className="min-h-12 w-full rounded-[1.15rem] border border-[#063F47]/10 bg-white/65 px-6 font-semibold text-[#063F47] shadow-sm backdrop-blur-xl">Cerrar sesión</button></form>
          <Link href="/mas" className="block text-center text-sm font-medium text-[#063F47]/55 underline-offset-4 hover:underline">Volver a Más</Link>
        </section>

        <DeleteAccountForm />
      </div>
    </div>
  );
}
