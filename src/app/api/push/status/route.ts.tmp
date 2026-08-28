import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GatewayStatus = { configured?: boolean; publicKey?: string | null };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let configured = false;
  let publicKey: string | null = null;
  if (base) {
    try {
      const response = await fetch(`${base}/functions/v1/push-gateway`, { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as GatewayStatus;
      configured = response.ok && data.configured === true && typeof data.publicKey === "string" && data.publicKey.length > 0;
      publicKey = configured ? data.publicKey ?? null : null;
    } catch {
      configured = false;
    }
  }

  let registeredDevices = 0;
  if (user) {
    const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    registeredDevices = count ?? 0;
  }

  return NextResponse.json({ authenticated: Boolean(user), configured, publicKey, registeredDevices }, { headers: { "Cache-Control": "no-store" } });
}
