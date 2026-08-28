import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPushConfigured } from "@/lib/push/send";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
  let registeredDevices = 0;

  if (user) {
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    registeredDevices = count ?? 0;
  }

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      configured: isPushConfigured(),
      publicKey: isPushConfigured() ? publicKey : null,
      registeredDevices,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
