import type { Metadata } from "next";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPasswordPage() {
  return <ResetPasswordForm />;
}
