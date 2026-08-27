import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/recuperar");
  return <NewPasswordForm />;
}
