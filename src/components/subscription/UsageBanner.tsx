import { useState } from "react";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Crown, Sparkles, X } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

export function UsageBanner() {
  const { subscription, loading, getRemainingWorkItems, getUsagePercentage, isTrialExpired } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (loading || !subscription || dismissed) return null;

  // Don't show for paid plans
  if (subscription.plan !== "free") return null;

  const remaining = getRemainingWorkItems();
  const percentage = getUsagePercentage();
  const isExpired = isTrialExpired();
  const isLow = typeof remaining === "number" && remaining <= 2 && remaining > 0;

  // Only show when usage is high or expired
  if (!isExpired && !isLow && percentage < 60) return null;

  return (
    <>
      <div className={`px-4 py-3 rounded-lg mb-4 flex items-center justify-between ${
        isExpired 
          ? "bg-destructive/10 border border-destructive/20" 
          : isLow 
            ? "bg-warning/10 border border-warning/20"
            : "bg-primary/5 border border-primary/20"
      }`}>
        <div className="flex items-center gap-4 flex-1">
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {isExpired 
                  ? "Free trial limit reached" 
                  : `${remaining} work items remaining`}
              </span>
              <Badge variant="outline" className="text-xs">
                Free Plan
              </Badge>
            </div>
            
            {!isExpired && (
              <Progress value={percentage} className="h-1.5 w-48" />
            )}
            
            {isExpired && (
              <p className="text-xs text-muted-foreground">
                Upgrade to continue creating work items and access all features
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => setUpgradeOpen(true)}
            className={isExpired ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade to Pro
          </Button>
          {!isExpired && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDismissed(true)}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <UpgradeModal 
        open={upgradeOpen} 
        onOpenChange={setUpgradeOpen}
        currentPlan={subscription.plan}
      />
    </>
  );
}
