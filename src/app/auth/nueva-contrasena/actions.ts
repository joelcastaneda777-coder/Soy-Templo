"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NewPasswordState = { error?: string };

const schema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export async function setRecoveredPassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const parsed = schema.safeParse({ password: formData.get("password"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "El enlace de recuperación venció o ya fue utilizado. Solicita uno nuevo." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "No pudimos actualizar la contraseña. Solicita un enlace nuevo e intenta otra vez." };

  await supabase.auth.signOut();
  redirect("/auth/login?password=updated");
}
