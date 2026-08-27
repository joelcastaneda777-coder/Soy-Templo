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

  if (!user) {
    redirect("/auth/login?next=/perfil");
  }

  const [{ data: profile }, plusAccess] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle(),
    getPlusAccess(),
  ]);

  const fullName = profile?.full_name || String(user.user_metadata?.full_name || "");
  const phone = profile?.phone || "";

  return (
    <div className="space-y-5">
      <PageHero title="Mi cuenta" />

      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-anil-100 text-xl font-bold text-anil-700">
            {(fullName || user.email || "S").trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold">{fullName || "Usuario Soy Templo"}</p>
            <p className="truncate text-sm text-tinta-suave">{user.email}</p>
          </div>
        </div>

        <Link href="/plus" className="block rounded-[var(--radius-card)] border border-anil-200 bg-anil-50/70 p-5 transition-colors hover:border-anil-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-anil-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Soy Templo+</span>
              <h2 className="mt-2 font-display text-xl font-semibold text-anil-900">
                {plusAccess.hasAccess ? "Acceso Plus activo" : "Conoce Soy Templo+"}
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">
                {plusAccess.hasAccess
                  ? "Radio en segundo plano y contenido especializado disponibles para tu cuenta."
                  : "Radio en segundo plano, planes especializados, audio y más."}
              </p>
            </div>
            <span className="font-semibold text-anil-600">Ver →</span>
          </div>
        </Link>

        <ProfileForm fullName={fullName} phone={phone} email={user.email || ""} />

        <section className="space-y-2">
          <div className="px-1">
            <h2 className="font-display text-xl font-semibold">Notificaciones</h2>
            <p className="text-sm text-tinta-suave">Elige qué novedades quieres recibir en este dispositivo.</p>
          </div>
          <NotificationSettings />
        </section>

        <PasswordForm />

        <div className="space-y-3 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
          <h2 className="font-display text-xl font-semibold">Sesión</h2>
          <form action={logout}>
            <button className="min-h-12 w-full rounded-full border border-manta px-6 font-semibold text-anil-700 hover:bg-anil-50">
              Cerrar sesión
            </button>
          </form>
          <Link href="/mas" className="block text-center text-sm font-medium text-tinta-suave underline-offset-4 hover:underline">
            Volver a Más
          </Link>
        </div>

        <DeleteAccountForm />
      </div>
    </div>
  );
}
