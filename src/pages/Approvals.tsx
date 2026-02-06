import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useNotifications } from "@/hooks/useNotifications";
import { CheckCircle2, XCircle, Eye, Clock, AlertTriangle, FileText, Receipt, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatRelativeTime } from "@/hooks/useActivityLog";

interface WorkItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  due_date: string | null;
  created_at: string;
  clients: { company_name: string };
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  gst: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  income_tax: { icon: Calculator, color: "text-blue-500", bg: "bg-blue-500/10" },
  accounting: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
  audit: { icon: AlertTriangle, color: "text-green-500", bg: "bg-green-500/10" },
  compliance: { icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  fpa: { icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
  risk: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  advisory: { icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { createNotification } = useNotifications();
  const [approvals, setApprovals] = useState<WorkItem[]>([]);
  const [completedApprovals, setCompletedApprovals] = useState<{ id: string; status: string; title: string }[]>([]);
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
      .order("created_at", { ascending: false });
    
    if (data) {
      setApprovals(data as WorkItem[]);
    }
    setLoading(false);
  };

  const handleApprove = async (item: WorkItem) => {
    const { error } = await supabase
      .from("work_items")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", item.id);
    
    if (error) {
      toast.error("Failed to approve");
    } else {
      toast.success("Approved successfully!");
      setCompletedApprovals(prev => [...prev, { id: item.id, status: "approved", title: item.title }]);
      await logActivity("complete", "work_item", item.id, { name: item.title, action: "approved" });
      await createNotification(
        "Work Item Approved",
        `${item.title} has been approved and marked as completed.`,
        "success",
        "work_item",
        item.id
      );
      fetchApprovals();
    }
  };

  const handleReject = async (item: WorkItem) => {
    const { error } = await supabase
      .from("work_items")
      .update({ status: "in_progress" })
      .eq("id", item.id);
    
    if (error) {
      toast.error("Failed to send back for revision");
    } else {
      toast.info("Sent back for revision");
      setCompletedApprovals(prev => [...prev, { id: item.id, status: "rejected", title: item.title }]);
      await logActivity("update", "work_item", item.id, { name: item.title, action: "sent_back" });
      await createNotification(
        "Work Item Needs Revision",
        `${item.title} has been sent back for revision.`,
        "warning",
        "work_item",
        item.id
      );
      fetchApprovals();
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    );
  }

  const pendingCount = approvals.length;
  const approvedCount = completedApprovals.filter(a => a.status === "approved").length;
  const rejectedCount = completedApprovals.filter(a => a.status === "rejected").length;
  const highPriorityCount = approvals.filter(a => {
    if (!a.due_date) return false;
    const daysLeft = Math.ceil((new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  }).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                CA Approval Queue
              </h1>
              <p className="text-muted-foreground">
                Review and approve agent-generated drafts before filing
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{rejectedCount}</p>
                    <p className="text-sm text-muted-foreground">Sent Back</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{highPriorityCount}</p>
                    <p className="text-sm text-muted-foreground">Urgent</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approval List */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                    <p className="font-medium">All caught up!</p>
                    <p className="text-sm">No pending approvals. Work items in "Review" status will appear here.</p>
                  </div>
                ) : (
                  approvals.map((item) => {
                    const config = typeConfig[item.category] || typeConfig.accounting;
                    const TypeIcon = config.icon;
                    const daysLeft = item.due_date 
                      ? Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isUrgent = daysLeft !== null && daysLeft <= 7;
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border transition-all",
                          isUrgent ? "border-warning/30" : "border-border",
                          "bg-card hover:bg-secondary/30"
                        )}
                      >
                        {/* Type Icon */}
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bg)}>
                          <TypeIcon className={cn("w-5 h-5", config.color)} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{item.description || "No description"}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{item.clients?.company_name}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(item.created_at)}</span>
                            {item.due_date && (
                              <>
                                <span>•</span>
                                <span className={cn(isUrgent && "text-destructive")}>
                                  Due: {new Date(item.due_date).toLocaleDateString("en-IN")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/work/${item.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleReject(item)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Send Back
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleApprove(item)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Completed Approvals */}
            {completedApprovals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedApprovals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                    >
                      {item.status === "approved" ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-warning" />
                      )}
                      <span className="flex-1 text-sm text-muted-foreground">{item.title}</span>
                      <Badge variant={item.status === "approved" ? "default" : "secondary"}>
                        {item.status === "approved" ? "Approved" : "Sent Back"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
