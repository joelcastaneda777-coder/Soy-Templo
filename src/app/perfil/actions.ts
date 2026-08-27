"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AccountState = { ok?: boolean; error?: string; message?: string };

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre.").max(120, "El nombre es demasiado largo."),
  phone: z.string().trim().max(40, "El teléfono es demasiado largo.").optional(),
});

const passwordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  confirmPassword: z.string().min(8),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

export async function updateProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "No pudimos guardar los cambios del perfil." };

  await supabase.auth.updateUser({ data: { full_name: parsed.data.fullName } });
  revalidatePath("/perfil");
  revalidatePath("/");
  return { ok: true, message: "Perfil actualizado." };
}

export async function updatePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa la contraseña." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "No pudimos cambiar la contraseña. Vuelve a intentarlo." };

  return { ok: true, message: "Contraseña actualizada correctamente." };
}

export async function deleteAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "ELIMINAR") {
    return { error: "Escribe ELIMINAR para confirmar." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase.rpc("delete_own_account");
  if (error) return { error: "No pudimos eliminar tu cuenta. Intenta de nuevo." };

  await supabase.auth.signOut();
  redirect("/?cuenta=eliminada");
}
