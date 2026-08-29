"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["member", "pastor", "editor", "admin", "superadmin"]),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: isAdmin } = await supabase.rpc("has_role", { check_role: "admin" });
  if (!isAdmin) throw new Error("No autorizado");
  const { data: callerRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return { supabase, user, isSuperadmin: (callerRoles ?? []).some((item) => item.role === "superadmin") };
}

export async function setUserRole(formData: FormData) {
  const parsed = roleSchema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) throw new Error("Rol inválido");

  const { supabase, user, isSuperadmin } = await requireAdmin();
  const { userId, role } = parsed.data;
  const [{ data: targetRoles }, { data: superadminRows }, { data: adminRows }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("user_roles").select("user_id").eq("role", "superadmin"),
    supabase.from("user_roles").select("user_id,role").in("role", ["admin", "superadmin"]),
  ]);

  const current = new Set((targetRoles ?? []).map((item) => item.role));
  const targetIsSuperadmin = current.has("superadmin");
  const targetIsAdmin = current.has("admin") || targetIsSuperadmin;
  const hasAnySuperadmin = (superadminRows ?? []).length > 0;

  if ((role === "superadmin" && hasAnySuperadmin && !isSuperadmin) || (targetIsSuperadmin && !isSuperadmin)) {
    throw new Error("Solo un superadministrador puede modificar el rol superadmin.");
  }

  if (targetIsAdmin && !["admin", "superadmin"].includes(role)) {
    const adminUsers = new Set((adminRows ?? []).map((item) => item.user_id));
    if (adminUsers.size <= 1) throw new Error("No puedes quitar el último administrador del sistema.");
  }

  const staffRoles = ["pastor", "editor", "admin", "superadmin"] as const;
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId).in("role", [...staffRoles]);
  if (deleteError) throw new Error("No pudimos actualizar el rol.");

  if (role !== "member") {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role, granted_by: user.id });
    if (error) throw new Error("No pudimos asignar el nuevo rol.");
  }

  revalidatePath("/admin/usuarios");
}

export async function getAuthUsersForAdmin() {
  const { supabase } = await requireAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    const service = createServiceClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (!error) {
      return data.users.map((account) => ({ id: account.id, email: account.email ?? "", createdAt: account.created_at }));
    }
  }

  // Fallback seguro: cuando la service role no está disponible en Vercel,
  // usamos los perfiles que el administrador ya puede consultar mediante RLS.
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (profileError) throw new Error("No pudimos cargar las cuentas de usuario.");
  return (profiles ?? []).map((profile) => ({ id: profile.id, email: "", createdAt: profile.created_at }));
}
