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

  const [{ data: isSubscriber }, { data: isStaff }, { data: subscriptions }] = await Promise.all([
    supabase.rpc("has_plus"),
    supabase.rpc("is_staff"),
    supabase
      .from("plus_subscriptions")
      .select("provider,product_id,status,current_period_end,auto_renewing,created_at")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const subscription = subscriptions?.[0] ?? null;
  return {
    isLoggedIn: true,
    isSubscriber: !!isSubscriber,
    isStaff: !!isStaff,
    hasAccess: !!isSubscriber || !!isStaff,
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
