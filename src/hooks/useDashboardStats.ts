import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DashboardStats {
  totalClients: number;
  activeWorkItems: number;
  completedThisMonth: number;
  pendingApprovals: number;
  gstReturns: {
    filed: number;
    pending: number;
    totalTax: number;
  };
  incomeTax: {
    computations: number;
    totalLiability: number;
  };
  complianceScore: number;
}

export function useDashboardStats() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Fetch all data in parallel
      const [
        clientsRes,
        workItemsRes,
        gstRes,
        itRes
      ] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("work_items").select("id, category, status, created_at, completed_at").eq("user_id", user.id),
        supabase.from("gst_returns").select("total_tax, work_items!inner(user_id, status)").eq("work_items.user_id", user.id),
        supabase.from("income_tax_computations").select("tax_liability, work_items!inner(user_id)").eq("work_items.user_id", user.id)
      ]);

      const workItems = workItemsRes.data || [];
      
      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const completedThisMonth = workItems.filter(w => 
        w.completed_at && new Date(w.completed_at) >= startOfMonth
      ).length;

      const activeWorkItems = workItems.filter(w => 
        w.status === "in_progress" || w.status === "review"
      ).length;

      const pendingApprovals = workItems.filter(w => w.status === "review").length;

      // GST stats
      const gstReturns = gstRes.data || [];
      const gstFiled = gstReturns.filter(g => (g.work_items as any)?.status === "filed").length;
      const gstPending = gstReturns.filter(g => (g.work_items as any)?.status !== "filed").length;
      const totalGstTax = gstReturns.reduce((sum, g) => sum + (Number(g.total_tax) || 0), 0);

      // Income Tax stats
      const itComputations = itRes.data || [];
      const totalItLiability = itComputations.reduce((sum, i) => sum + (Number(i.tax_liability) || 0), 0);

      // Calculate compliance score (simplified)
      const totalWork = workItems.length;
      const completedWork = workItems.filter(w => 
        w.status === "completed" || w.status === "filed"
      ).length;
      
      const complianceScore = totalWork > 0 
        ? Math.round((completedWork / totalWork) * 100)
        : 100;

      return {
        totalClients: clientsRes.count || 0,
        activeWorkItems,
        completedThisMonth,
        pendingApprovals,
        gstReturns: {
          filed: gstFiled,
          pending: gstPending,
          totalTax: totalGstTax
        },
        incomeTax: {
          computations: itComputations.length,
          totalLiability: totalItLiability
        },
        complianceScore
      } as DashboardStats;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return { stats: stats || null, loading, refetch, formatCurrency };
}