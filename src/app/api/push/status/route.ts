import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPushConfig } from "@/lib/push/send";

export async function GET() {
  const supabase = await createClient();
  const [{ data: { user } }, config] = await Promise.all([supabase.auth.getUser(), getPushConfig()]);
  let registeredDevices = 0;
  if (user) {
    const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    registeredDevices = count ?? 0;
  }
  return NextResponse.json({ authenticated: Boolean(user), configured: Boolean(config), publicKey: config?.publicKey ?? null, registeredDevices }, { headers: { "Cache-Control": "no-store" } });
}
