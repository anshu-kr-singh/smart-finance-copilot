import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Building2 } from "lucide-react";

export function SubscriptionBadge() {
  const { subscription, loading } = useSubscription();

  if (loading || !subscription) return null;

  const planConfig = {
    free: { icon: Zap, className: "bg-secondary text-secondary-foreground" },
    professional: { icon: Crown, className: "bg-primary text-primary-foreground" },
    enterprise: { icon: Building2, className: "bg-gradient-to-r from-amber-500 to-orange-600 text-white" }
  };

  const config = planConfig[subscription.plan];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1`}>
      <Icon className="w-3 h-3" />
      {PLANS[subscription.plan].name}
    </Badge>
  );
}
