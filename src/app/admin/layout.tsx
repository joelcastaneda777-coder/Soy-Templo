import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout del panel administrativo.
 * El middleware ya protege /admin, pero se verifica de nuevo aquí
 * (defensa en profundidad) y RLS protege los datos en última instancia.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin");
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) redirect("/");

  const sections = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/devocionales", label: "Devocionales" },
    { href: "/admin/planes", label: "Planes bíblicos" },
    { href: "/admin/anuncios", label: "Anuncios" },
    { href: "/admin/eventos", label: "Eventos" },
    { href: "/admin/donaciones", label: "Donaciones" },
    { href: "/admin/oracion", label: "Peticiones" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/configuracion", label: "Configuración" },
  ];

  return (
    <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
      <aside className="mb-6 md:mb-0">
        <p className="font-display text-lg font-semibold text-anil-800">Panel · Soy Templo</p>
        <nav aria-label="Secciones del panel" className="mt-3">
          <ul className="flex gap-2 overflow-x-auto md:flex-col">
            {sections.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="block whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium hover:bg-anil-50"
                >
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
