import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const [{ data: { user } }, keyResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_push_vapid_public_key"),
  ]);

  const publicKey = !keyResult.error && typeof keyResult.data === "string" ? keyResult.data : null;
  let registeredDevices = 0;
  if (user) {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    registeredDevices = count ?? 0;
  }

  return NextResponse.json(
    { authenticated: Boolean(user), configured: Boolean(publicKey), publicKey, registeredDevices },
    { headers: { "Cache-Control": "no-store" } }
  );
}
