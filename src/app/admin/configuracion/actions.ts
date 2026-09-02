"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const identitySchema = z.object({
  churchName: z.string().trim().min(2).max(120),
  appName: z.string().trim().min(2).max(80),
  supportEmail: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(240).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const allowed = (roles ?? []).some((item) => item.role === "admin" || item.role === "superadmin");
  if (!allowed) throw new Error("No autorizado");
  return { supabase, user };
}

export async function saveSiteIdentity(formData: FormData) {
  const parsed = identitySchema.safeParse({
    churchName: formData.get("churchName"),
    appName: formData.get("appName"),
    supportEmail: formData.get("supportEmail") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    website: formData.get("website") || "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { supabase, user } = await requireAdmin();
  const value = {
    church_name: parsed.data.churchName,
    app_name: parsed.data.appName,
    support_email: parsed.data.supportEmail || null,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    website: parsed.data.website || null,
  };

  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "site_identity", value, updated_by: user.id }, { onConflict: "key" });
  if (error) throw new Error(`No pudimos guardar la identidad: ${error.message}`);
  revalidatePath("/admin/configuracion");
}
