import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreditsState {
  plan: "free" | "pro";
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useCredits() {
  const { user } = useAuth();
  const [state, setState] = useState<CreditsState>({
    plan: "free",
    totalCredits: 50,
    usedCredits: 0,
    remainingCredits: 50,
    subscribed: false,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        plan: data.plan || "free",
        totalCredits: data.total_credits ?? 50,
        usedCredits: data.used_credits ?? 0,
        remainingCredits: (data.total_credits ?? 50) - (data.used_credits ?? 0),
        subscribed: data.subscribed ?? false,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async () => {
    const { data, error } = await supabase.functions.invoke("create-checkout");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  };

  return { ...state, checkSubscription, startCheckout, openPortal };
}

// Credit costs
export const CREDIT_COSTS = {
  PAGE_GENERATION: 10,
  IMAGE_GENERATION: 20,
  PDF_EXPORT: 50,
  AI_REWRITE: 5,
} as const;
