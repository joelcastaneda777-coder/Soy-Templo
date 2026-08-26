import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationOnboarding } from "./notification-onboarding";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/onboarding");

  return <NotificationOnboarding />;
}
