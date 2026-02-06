import { useState, useEffect } from "react";
import { FileText, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatRelativeTime } from "@/hooks/useActivityLog";

interface WorkItem {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  due_date: string | null;
  clients: { company_name: string };
}

const categoryLabels: Record<string, string> = {
  accounting: "Journal Entry",
  gst: "GST Return",
  income_tax: "Tax Computation",
  audit: "Audit Finding",
  compliance: "Compliance",
  fpa: "FP&A Report",
  risk: "Risk Assessment",
  advisory: "Advisory",
};

export function ApprovalQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApprovals();
    }
  }, [user]);

  const fetchApprovals = async () => {
    const { data, error } = await supabase
      .from("work_items")
      .select("*, clients(company_name)")
      .eq("status", "review")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data) {
      setApprovals(data as WorkItem[]);
    }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("work_items")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to approve");
    } else {
      toast.success("Approved successfully!");
      fetchApprovals();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("work_items")
      .update({ status: "in_progress" })
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to send back for revision");
    } else {
      toast.info("Sent back for revision");
      fetchApprovals();
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-semibold text-foreground">Pending Approvals</h3>
            <span className={cn(
              "px-2 py-0.5 text-xs font-semibold rounded-full",
              approvals.length > 0 
                ? "bg-destructive/10 text-destructive"
                : "bg-success/10 text-success"
            )}>
              {approvals.length > 0 ? `${approvals.length} pending` : "All clear"}
            </span>
          </div>
          <button 
            onClick={() => navigate("/approvals")}
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            View All
          </button>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
          <p>No pending approvals</p>
          <p className="text-sm">Items requiring review will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {approvals.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded border bg-warning/10 text-warning border-warning/20 mb-1">
                        REVIEW
                      </span>
                      <p className="font-medium text-foreground">{item.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span>•</span>
                    <span>{item.clients?.company_name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => handleApprove(item.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => navigate(`/work/${item.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleReject(item.id)}
                    >
                      <XCircle className="w-4 h-4" />
                      Send Back
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
