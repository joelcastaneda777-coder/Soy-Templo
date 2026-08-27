import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; password?: string }>;
}) {
  const { next, password } = await searchParams;
  return <LoginForm next={next} passwordUpdated={password === "updated"} />;
}
