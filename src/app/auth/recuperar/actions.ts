"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ResetRequestState = { error?: string; message?: string };

const schema = z.object({ email: z.string().trim().email("Escribe un correo válido") });

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) return { error: "La recuperación de contraseña todavía no está configurada." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/nueva-contrasena`,
  });

  if (error) return { error: "No pudimos enviar el correo en este momento. Intenta nuevamente." };
  return { message: "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña." };
}
