import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AgentStats {
  category: string;
  completed: number;
  total: number;
  inProgress: number;
  lastActivity: string | null;
}

export function useAgentStats() {
  const { user } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["agent-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};

      // Get all work items grouped by category and status
      const { data: workItems, error } = await supabase
        .from("work_items")
        .select("category, status, updated_at")
        .eq("user_id", user.id);

      if (error) throw error;

      // Process into stats by category
      const categoryStats: Record<string, AgentStats> = {};
      
      const categories = ["gst", "income_tax", "audit", "compliance", "accounting", "fpa", "advisory"];
      
      categories.forEach(cat => {
        categoryStats[cat] = {
          category: cat,
          completed: 0,
          total: 0,
          inProgress: 0,
          lastActivity: null,
        };
      });

      workItems?.forEach(item => {
        const cat = item.category;
        if (!categoryStats[cat]) {
          categoryStats[cat] = {
            category: cat,
            completed: 0,
            total: 0,
            inProgress: 0,
            lastActivity: null,
          };
        }

        categoryStats[cat].total++;
        
        if (item.status === "completed" || item.status === "filed") {
          categoryStats[cat].completed++;
        } else if (item.status === "in_progress" || item.status === "review") {
          categoryStats[cat].inProgress++;
        }

        // Track last activity
        if (!categoryStats[cat].lastActivity || 
            new Date(item.updated_at) > new Date(categoryStats[cat].lastActivity!)) {
          categoryStats[cat].lastActivity = item.updated_at;
        }
      });

      return categoryStats;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getAgentStats = (agentType: string) => {
    // Map agent types to work_item categories
    const categoryMap: Record<string, string> = {
      gst: "gst",
      incometax: "income_tax",
      audit: "audit",
      compliance: "compliance",
      accounting: "accounting",
      advisory: "advisory",
      fpa: "fpa",
    };

    const category = categoryMap[agentType] || agentType;
    return stats?.[category] || {
      category,
      completed: 0,
      total: 0,
      inProgress: 0,
      lastActivity: null,
    };
  };

  const formatLastRun = (lastActivity: string | null) => {
    if (!lastActivity) return "Ready";

    const now = new Date();
    const activity = new Date(lastActivity);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return activity.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getAgentStatus = (agentStats: AgentStats): "active" | "processing" | "idle" | "alert" => {
    if (agentStats.inProgress > 0) return "processing";
    if (agentStats.total > 0 && agentStats.completed < agentStats.total) return "active";
    if (agentStats.total === 0) return "idle";
    return "active";
  };

  return {
    stats,
    isLoading,
    refetch,
    getAgentStats,
    formatLastRun,
    getAgentStatus,
  };
}