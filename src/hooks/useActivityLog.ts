import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

function parseDetails(details: unknown): Record<string, any> {
  if (typeof details === 'object' && details !== null) {
    return details as Record<string, any>;
  }
  return {};
}

export function useActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async (limit = 50) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching activities:", error);
    } else {
      const typedData = (data || []).map(d => ({
        ...d,
        details: parseDetails(d.details)
      }));
      setActivities(typedData);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchActivities();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('activity_logs_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newActivity = {
              ...payload.new as any,
              details: parseDetails((payload.new as any).details)
            } as ActivityLog;
            setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchActivities]);

  const logActivity = async (
    action: string, 
    entityType: string, 
    entityId?: string | null, 
    details?: Record<string, any>
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || {}
      });

    if (error) {
      console.error("Error logging activity:", error);
    }
  };

  return { activities, loading, logActivity, refetch: fetchActivities };
}

// Utility function for formatting activity messages
export function formatActivityMessage(activity: ActivityLog): string {
  const { action, entity_type, details } = activity;
  
  const entityLabels: Record<string, string> = {
    client: "client",
    work_item: "work item",
    report: "report",
    document: "document",
    profile: "profile",
    gst_return: "GST return",
    income_tax: "income tax computation",
    journal_entry: "journal entry",
    audit_finding: "audit finding",
    compliance_task: "compliance task"
  };

  const entityLabel = entityLabels[entity_type] || entity_type;
  
  switch (action) {
    case "create":
      return `Created ${entityLabel}${details?.name ? ` "${details.name}"` : ""}`;
    case "update":
      return `Updated ${entityLabel}${details?.name ? ` "${details.name}"` : ""}`;
    case "delete":
      return `Deleted ${entityLabel}${details?.name ? ` "${details.name}"` : ""}`;
    case "complete":
      return `Completed ${entityLabel}${details?.name ? ` "${details.name}"` : ""}`;
    case "file":
      return `Filed ${entityLabel}${details?.name ? ` "${details.name}"` : ""}`;
    case "upload":
      return `Uploaded ${details?.name || "file"}`;
    case "download":
      return `Downloaded ${details?.name || "file"}`;
    case "login":
      return "Logged in";
    case "logout":
      return "Logged out";
    case "reconcile":
      return `Ran reconciliation${details?.files ? ` on ${details.files} files` : ""}`;
    case "query":
      return `Asked AI: "${details?.query?.substring(0, 50)}${details?.query?.length > 50 ? '...' : ''}"`;
    default:
      return `${action} ${entityLabel}`;
  }
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}
