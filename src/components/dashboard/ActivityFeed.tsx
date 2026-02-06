import { useActivityLog, formatActivityMessage, formatRelativeTime } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, User, Building2, Receipt, Calculator, ClipboardCheck, Upload, Download, MessageSquare, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const entityIcons: Record<string, typeof FileText> = {
  client: Building2,
  work_item: FileText,
  gst_return: Receipt,
  income_tax: Calculator,
  audit_finding: ClipboardCheck,
  document: Upload,
  report: Download,
  query: MessageSquare,
  auth: LogIn,
  profile: User
};

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-primary/10 text-primary",
  delete: "bg-destructive/10 text-destructive",
  complete: "bg-success/10 text-success",
  file: "bg-accent/10 text-accent",
  upload: "bg-primary/10 text-primary",
  download: "bg-secondary text-secondary-foreground",
  login: "bg-success/10 text-success",
  logout: "bg-warning/10 text-warning",
  reconcile: "bg-accent/10 text-accent",
  query: "bg-primary/10 text-primary"
};

interface ActivityFeedProps {
  maxItems?: number;
  showTitle?: boolean;
  compact?: boolean;
}

export function ActivityFeed({ maxItems = 10, showTitle = true, compact = false }: ActivityFeedProps) {
  const { activities, loading } = useActivityLog();

  const displayActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayActivities.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Start by adding a client or creating work items</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
            <Badge variant="secondary" className="ml-auto">
              Live
              <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-1.5" />
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(compact ? "p-3" : "")}>
        <div className="space-y-3">
          {displayActivities.map((activity) => {
            const Icon = entityIcons[activity.entity_type] || FileText;
            const colorClass = actionColors[activity.action] || "bg-secondary text-secondary-foreground";
            
            return (
              <div 
                key={activity.id} 
                className={cn(
                  "flex items-start gap-3",
                  compact ? "py-2" : "py-2 border-b border-border last:border-0"
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-foreground", compact ? "text-sm" : "")}>
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
