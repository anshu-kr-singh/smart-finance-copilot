import { cn } from "@/lib/utils";
import { LucideIcon, Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AgentCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "processing" | "idle" | "alert";
  tasksCompleted: number;
  agentType: string;
  tasksTotal: number;
  lastRun?: string;
  variant?: "gst" | "tax" | "audit" | "compliance" | "accounting" | "advisory";
}

const statusConfig = {
  active: {
    label: "Active",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Activity,
  },
  idle: {
    label: "Idle",
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: Clock,
  },
  alert: {
    label: "Needs Attention",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: AlertTriangle,
  },
};

const variantGradients = {
  gst: "from-orange-500 to-red-500",
  tax: "from-blue-500 to-indigo-500",
  audit: "from-purple-500 to-pink-500",
  compliance: "from-green-500 to-teal-500",
  accounting: "from-cyan-500 to-blue-500",
  advisory: "from-amber-500 to-orange-500",
};

export function AgentCard({
  name,
  description,
  icon: Icon,
  status,
  tasksCompleted,
  tasksTotal,
  lastRun,
  variant = "accounting",
  agentType,
}: AgentCardProps) {
  const navigate = useNavigate();
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const progress = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

  const handleOpenAgent = () => {
    navigate(`/agents/${agentType}`);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-lg transition-all duration-300 group overflow-hidden">
      {/* Gradient Header */}
      <div className={cn("h-1.5 bg-gradient-to-r", variantGradients[variant])} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform",
              variantGradients[variant]
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-semibold text-foreground truncate">{name}</h3>
              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", statusInfo.bg, statusInfo.color)}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Tasks Progress</span>
            <span className="font-medium text-foreground">
              {tasksCompleted}/{tasksTotal}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full bg-gradient-to-r transition-all duration-500", variantGradients[variant])}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {lastRun && (
            <span className="text-xs text-muted-foreground">Last run: {lastRun}</span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-primary hover:text-primary/80"
            onClick={handleOpenAgent}
          >
            Open Agent →
          </Button>
        </div>
      </div>
    </div>
  );
}
