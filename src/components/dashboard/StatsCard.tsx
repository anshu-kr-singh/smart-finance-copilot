import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  variant?: "default" | "primary" | "accent" | "success" | "warning";
}

export function StatsCard({ title, value, change, icon: Icon, variant = "default" }: StatsCardProps) {
  const isPositive = change && change.value >= 0;

  const iconVariants = {
    default: "bg-secondary text-foreground",
    primary: "gradient-primary text-primary-foreground shadow-lg shadow-primary/25",
    accent: "gradient-accent text-accent-foreground shadow-lg shadow-accent/25",
    success: "bg-success text-success-foreground shadow-lg shadow-success/25",
    warning: "bg-warning text-warning-foreground shadow-lg shadow-warning/25",
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          {change && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}{change.value}%
              </span>
              <span className="text-sm text-muted-foreground">{change.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            iconVariants[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
