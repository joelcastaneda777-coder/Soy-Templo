import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout del panel administrativo.
 * El middleware protege /admin; aquí además se limita la navegación según rol.
 * Las páginas sensibles verifican el rol de nuevo y RLS protege los datos.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin");

  const [{ data: isStaff }, { data: roles }] = await Promise.all([
    supabase.rpc("is_staff"),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  if (!isStaff) redirect("/");

  const roleSet = new Set((roles ?? []).map((item) => item.role));
  const isAdmin = roleSet.has("admin") || roleSet.has("superadmin");

  const contentSections = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/devocionales", label: "Devocionales" },
    { href: "/admin/planes", label: "Planes bíblicos" },
    { href: "/admin/radio", label: "Radio" },
    { href: "/admin/anuncios", label: "Anuncios" },
    { href: "/admin/eventos", label: "Eventos" },
    { href: "/admin/sermones", label: "Sermones" },
    { href: "/admin/notificaciones", label: "Notificaciones" },
    { href: "/admin/oracion", label: "Peticiones" },
  ];

  const adminSections = [
    { href: "/admin/donaciones", label: "Donaciones" },
    { href: "/admin/plus", label: "Soy Templo+" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/configuracion", label: "Configuración" },
  ];

  const sections = isAdmin ? [...contentSections, ...adminSections] : contentSections;

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
      <aside className="mb-6 md:mb-0">
        <p className="font-display text-lg font-semibold text-anil-800">Panel · Soy Templo</p>
        <nav aria-label="Secciones del panel" className="mt-3">
          <ul className="flex gap-2 overflow-x-auto md:flex-col">
            {sections.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="block whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium hover:bg-anil-50">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
