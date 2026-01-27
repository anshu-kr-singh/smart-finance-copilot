import { CheckCircle2, AlertTriangle, FileText, Upload, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "success" | "warning" | "info" | "upload";
  title: string;
  description: string;
  time: string;
  agent?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "success",
    title: "GSTR-3B Draft Ready",
    description: "December 2024 return generated with ₹45,230 payable",
    time: "5 min ago",
    agent: "GST Agent",
  },
  {
    id: "2",
    type: "warning",
    title: "ITC Mismatch Detected",
    description: "3 invoices worth ₹12,450 need verification",
    time: "15 min ago",
    agent: "GST Agent",
  },
  {
    id: "3",
    type: "upload",
    title: "Bank Statement Processed",
    description: "HDFC Bank - 142 transactions classified",
    time: "1 hour ago",
    agent: "Accounting Agent",
  },
  {
    id: "4",
    type: "info",
    title: "Advance Tax Reminder",
    description: "Q4 deadline in 15 days - Estimated: ₹2,34,000",
    time: "2 hours ago",
    agent: "Income Tax Agent",
  },
  {
    id: "5",
    type: "success",
    title: "Monthly Closing Complete",
    description: "November books finalized with 0 mismatches",
    time: "3 hours ago",
    agent: "Accounting Agent",
  },
];

const typeConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  info: {
    icon: Clock,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  upload: {
    icon: Upload,
    color: "text-accent",
    bg: "bg-accent/10",
  },
};

export function RecentActivity() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
            >
              <div className="flex gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    config.bg
                  )}
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                  {activity.agent && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-secondary text-xs font-medium text-secondary-foreground rounded">
                      {activity.agent}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
