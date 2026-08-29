"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ResetRequestState = { error?: string; message?: string };

const schema = z.object({ email: z.string().trim().email("Escribe un correo válido") });

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function resolveSiteUrl() {
  const configured = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) return configured;

  const productionUrl = normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (productionUrl) return productionUrl;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return configured;

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (/localhost|127\.0\.0\.1/i.test(host) ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function requestPasswordReset(_prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const siteUrl = await resolveSiteUrl();
  if (!siteUrl) return { error: "La recuperación de contraseña todavía no está configurada." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/nueva-contrasena`,
  });

  if (error) {
    console.error("Password recovery request failed", {
      code: error.code,
      status: error.status,
      message: error.message,
      redirectTo: `${siteUrl}/auth/callback?next=/auth/nueva-contrasena`,
    });
    return { error: "No pudimos enviar el correo en este momento. Intenta nuevamente." };
  }

  return { message: "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña." };
}
