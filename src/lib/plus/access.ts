import { createClient } from "@/lib/supabase/server";

export type PlusAccess = {
  isLoggedIn: boolean;
  isSubscriber: boolean;
  isStaff: boolean;
  hasAccess: boolean;
  subscription: {
    provider: string;
    product_id: string;
    status: string;
    current_period_end: string | null;
    auto_renewing: boolean;
  } | null;
};

export async function getPlusAccess(): Promise<PlusAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      isLoggedIn: false,
      isSubscriber: false,
      isStaff: false,
      hasAccess: false,
      subscription: null,
    };
  }

  const [{ data: isStaff }, { data: subscriptions }] = await Promise.all([
    supabase.rpc("is_staff"),
    supabase
      .from("plus_subscriptions")
      .select("provider,product_id,status,current_period_end,auto_renewing,created_at")
      .in("status", ["trialing", "active", "grace_period"])
      .order("current_period_end", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const candidate = subscriptions?.[0] ?? null;
  const periodIsCurrent = candidate
    ? !candidate.current_period_end || new Date(candidate.current_period_end).getTime() > Date.now()
    : false;
  const isSubscriber = !!candidate && periodIsCurrent;
  const subscription = isSubscriber ? candidate : null;

  return {
    isLoggedIn: true,
    isSubscriber,
    isStaff: !!isStaff,
    hasAccess: isSubscriber || !!isStaff,
    subscription: subscription
      ? {
          provider: subscription.provider,
          product_id: subscription.product_id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          auto_renewing: subscription.auto_renewing,
        }
      : null,
  };
}
