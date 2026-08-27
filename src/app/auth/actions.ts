"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n/es";

const credentialsSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const emailSchema = z.string().trim().email("Correo inválido");

function confirmationRedirect() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return siteUrl ? `${siteUrl}/auth/callback?next=/oracion` : undefined;
}

export type AuthState = {
  error?: string;
  message?: string;
  needsConfirmation?: boolean;
  email?: string;
};

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "email_not_confirmed" || /email not confirmed/i.test(error.message)) {
      return {
        error: "Tu cuenta existe, pero todavía debes confirmar tu correo antes de iniciar sesión.",
        needsConfirmation: true,
        email: parsed.data.email,
      };
    }
    return { error: t.auth.invalid };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/");
}

export async function resendConfirmation(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: confirmationRedirect() },
  });

  if (error) {
    return {
      error: "No pudimos reenviar el correo en este momento. Espera un minuto e inténtalo otra vez.",
      needsConfirmation: true,
      email: parsed.data,
    };
  }

  return {
    message: "Te enviamos un nuevo enlace de confirmación. Revisa también Spam o Promociones.",
    email: parsed.data,
  };
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
      emailRedirectTo: confirmationRedirect(),
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
