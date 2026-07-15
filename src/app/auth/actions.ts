"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";

const credentialsSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type AuthState = { error?: string; message?: string };

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: t.auth.invalid };

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema
    .extend({ fullName: z.string().trim().min(2, "Escribe tu nombre").max(120) })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      fullName: formData.get("fullName"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login`,
    },
  });
  if (error) return { error: "No pudimos crear la cuenta. Intenta con otro correo." };
  return { message: t.auth.checkEmail };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
