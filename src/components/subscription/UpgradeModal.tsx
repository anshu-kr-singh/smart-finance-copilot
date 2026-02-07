import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";
import { PLANS, SubscriptionPlan } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: SubscriptionPlan;
}

export function UpgradeModal({ open, onOpenChange, currentPlan = "free" }: UpgradeModalProps) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    if (plan === "free" || plan === currentPlan) return;

    setLoading(plan);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        return;
      }

      // Call the Razorpay edge function to create order
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          plan,
          amount: PLANS[plan].price,
          currency: "INR",
          userId: user.id,
          email: user.email
        }
      });

      if (error) throw error;

      // Initialize Razorpay checkout
      const options = {
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: "TaxAgent AI",
        description: `${PLANS[plan].name} Subscription`,
        order_id: data.orderId,
        handler: async (response: any) => {
          // Verify payment with backend
          const { error: verifyError } = await supabase.functions.invoke("razorpay-verify-payment", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
              userId: user.id
            }
          });

          if (verifyError) {
            toast.error("Payment verification failed");
            return;
          }

          toast.success(`Successfully upgraded to ${PLANS[plan].name}!`);
          onOpenChange(false);
        },
        prefill: {
          email: user.email
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: () => {
            setLoading(null);
          }
        }
      };

      // @ts-ignore - Razorpay is loaded from script
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const planIcons: Record<SubscriptionPlan, typeof Zap> = {
    free: Zap,
    professional: Crown,
    enterprise: Building2
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose the plan that works best for your CA practice
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {(Object.entries(PLANS) as [SubscriptionPlan, typeof PLANS.free][]).map(([planKey, plan]) => {
            const Icon = planIcons[planKey];
            const isCurrent = planKey === currentPlan;
            const isPopular = plan.popular;

            return (
              <Card 
                key={planKey} 
                className={`relative ${isPopular ? "border-primary shadow-lg ring-2 ring-primary/20" : ""} ${isCurrent ? "bg-secondary/50" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    planKey === "free" ? "bg-secondary" : 
                    planKey === "professional" ? "gradient-primary" : 
                    "bg-gradient-to-br from-amber-500 to-orange-600"
                  }`}>
                    <Icon className={`w-6 h-6 ${planKey === "free" ? "text-muted-foreground" : "text-white"}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">{plan.priceDisplay}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={isCurrent ? "secondary" : isPopular ? "default" : "outline"}
                    disabled={isCurrent || loading !== null}
                    onClick={() => handleUpgrade(planKey)}
                  >
                    {loading === planKey ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : planKey === "free" ? (
                      "Free"
                    ) : (
                      "Upgrade Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Secure payments powered by Razorpay. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
