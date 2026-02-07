import { useState } from "react";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Crown, Lock, Check, Sparkles } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface PaywallGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function PaywallGate({ children, feature = "this feature" }: PaywallGateProps) {
  const { subscription, loading, isTrialExpired } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Allow access if not expired or on paid plan
  if (!isTrialExpired()) {
    return <>{children}</>;
  }

  // Show paywall
  return (
    <>
      <Card className="max-w-2xl mx-auto my-8 border-2 border-dashed border-primary/30">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-display">
            Upgrade to Continue
          </CardTitle>
          <CardDescription className="text-base">
            You've used all 5 free work items. Upgrade to Professional for unlimited access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold">Professional Plan - {PLANS.professional.priceDisplay}</span>
            </div>
            <ul className="grid grid-cols-2 gap-2">
              {PLANS.professional.features.slice(0, 6).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => setUpgradeOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Professional
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure payment via Razorpay • Cancel anytime • GST invoice included
            </p>
          </div>
        </CardContent>
      </Card>

      <UpgradeModal 
        open={upgradeOpen} 
        onOpenChange={setUpgradeOpen}
        currentPlan={subscription?.plan || "free"}
      />
    </>
  );
}
