import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuthUsersForAdmin, setUserRole } from "./actions";

export const metadata: Metadata = { title: "Usuarios · Panel" };

const rolePriority = ["superadmin", "admin", "editor", "pastor", "member"] as const;
const roleNames: Record<string, string> = {
  member: "Usuario",
  pastor: "Pastor / autor",
  editor: "Editor",
  admin: "Administrador",
  superadmin: "Superadministrador",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("has_role", { check_role: "admin" });
  if (!isAdmin) return <p className="rounded-[var(--radius-card)] border border-manta bg-white p-5 text-sm">La gestión de usuarios está disponible únicamente para administradores.</p>;

  const [accounts, profileResult, roleResult] = await Promise.all([
    getAuthUsersForAdmin(),
    supabase.from("profiles").select("id,full_name,phone"),
    supabase.from("user_roles").select("user_id,role"),
  ]);

  const profiles = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));
  const rolesByUser = new Map<string, string[]>();
  for (const row of roleResult.data ?? []) rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-anil-800">Usuarios y permisos</h1>
        <p className="mt-1 text-sm text-tinta-suave">Asigna responsabilidades sin dar acceso financiero a quienes solo administran contenido.</p>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-manta bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-manta text-xs text-tinta-suave"><th className="p-3">Usuario</th><th className="p-3">Correo</th><th className="p-3">Rol</th><th className="p-3">Cambiar permiso</th></tr></thead>
          <tbody>
            {accounts.map((account) => {
              const profile = profiles.get(account.id);
              const roles = rolesByUser.get(account.id) ?? ["member"];
              const currentRole = rolePriority.find((role) => roles.includes(role)) ?? "member";
              return (
                <tr key={account.id} className="border-b border-manta/60 last:border-0">
                  <td className="p-3"><strong>{profile?.full_name || "Usuario Soy Templo"}</strong>{profile?.phone ? <div className="text-xs text-tinta-suave">{profile.phone}</div> : null}</td>
                  <td className="p-3 text-xs">{account.email}</td>
                  <td className="p-3"><span className="rounded-full bg-anil-50 px-3 py-1 text-xs font-semibold text-anil-700">{roleNames[currentRole]}</span></td>
                  <td className="p-3">
                    <form action={setUserRole} className="flex gap-2">
                      <input type="hidden" name="userId" value={account.id} />
                      <select name="role" defaultValue={currentRole} className="min-h-10 rounded-xl border border-manta bg-white px-3 text-sm">
                        <option value="member">Usuario</option>
                        <option value="pastor">Pastor / autor</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                        <option value="superadmin">Superadministrador</option>
                      </select>
                      <button className="min-h-10 rounded-full bg-anil-600 px-4 font-semibold text-white">Guardar</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-relaxed text-tinta-suave">Pastor y Editor pueden trabajar contenido. Administrador puede acceder a usuarios, suscripciones y donaciones. Superadministrador está reservado para el control institucional de mayor nivel.</p>
    </div>
  );
}
