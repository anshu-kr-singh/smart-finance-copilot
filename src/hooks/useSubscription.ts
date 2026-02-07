import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionPlan = "free" | "professional" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  work_items_used: number;
  work_items_limit: number;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanDetails {
  name: string;
  price: number;
  priceDisplay: string;
  features: string[];
  workItemsLimit: number | "unlimited";
  popular?: boolean;
}

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: "Free Trial",
    price: 0,
    priceDisplay: "₹0",
    features: [
      "5 Work Items",
      "All AI Agents",
      "PDF Reports",
      "Activity Logging",
      "Email Support"
    ],
    workItemsLimit: 5
  },
  professional: {
    name: "Professional",
    price: 99900, // ₹999 in paise
    priceDisplay: "₹999/month",
    features: [
      "Unlimited Work Items",
      "All AI Agents",
      "PDF Reports",
      "Activity Logging",
      "Audit Trail",
      "Priority Support",
      "Client Portal Access"
    ],
    workItemsLimit: "unlimited",
    popular: true
  },
  enterprise: {
    name: "Enterprise",
    price: 249900, // ₹2499 in paise
    priceDisplay: "₹2,499/month",
    features: [
      "Everything in Professional",
      "Multi-user Access",
      "Custom Integrations",
      "API Access",
      "Dedicated Account Manager",
      "On-premise Deployment Option",
      "SLA Guarantee"
    ],
    workItemsLimit: "unlimited"
  }
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      // Subscribe to real-time changes
      const channel = supabase
        .channel("subscription-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "subscriptions",
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              setSubscription(payload.new as Subscription);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error);
    }

    // If no subscription exists, create a free one
    if (!data) {
      const { data: newSub, error: insertError } = await supabase
        .from("subscriptions")
        .insert([{ user_id: user.id }])
        .select()
        .single();

      if (!insertError && newSub) {
        setSubscription(newSub as Subscription);
      }
    } else {
      setSubscription(data as Subscription);
    }

    setLoading(false);
  };

  const canCreateWorkItem = (): boolean => {
    if (!subscription) return true; // Allow if no subscription yet
    if (subscription.plan !== "free") return true;
    return subscription.work_items_used < subscription.work_items_limit;
  };

  const getRemainingWorkItems = (): number | "unlimited" => {
    if (!subscription) return 5;
    if (subscription.plan !== "free") return "unlimited";
    return Math.max(0, subscription.work_items_limit - subscription.work_items_used);
  };

  const getUsagePercentage = (): number => {
    if (!subscription) return 0;
    if (subscription.plan !== "free") return 0;
    return Math.min(100, (subscription.work_items_used / subscription.work_items_limit) * 100);
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase.rpc("increment_work_items_used", {
      p_user_id: user.id
    });

    if (error) {
      console.error("Error incrementing usage:", error);
      return false;
    }

    await fetchSubscription();
    return data === true;
  };

  const isPaidPlan = (): boolean => {
    return subscription?.plan === "professional" || subscription?.plan === "enterprise";
  };

  const isTrialExpired = (): boolean => {
    if (!subscription) return false;
    return subscription.plan === "free" && subscription.work_items_used >= subscription.work_items_limit;
  };

  return {
    subscription,
    loading,
    canCreateWorkItem,
    getRemainingWorkItems,
    getUsagePercentage,
    incrementUsage,
    isPaidPlan,
    isTrialExpired,
    refetch: fetchSubscription
  };
}
