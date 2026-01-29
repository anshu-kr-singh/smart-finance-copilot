import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, XCircle, Eye, Clock, AlertTriangle, FileText, Receipt, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  type: "gstr" | "itr" | "journal" | "compliance";
  agent: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  dueDate: string;
  status: "pending" | "approved" | "rejected";
  details?: {
    amount?: string;
    period?: string;
    entries?: number;
  };
}

const initialApprovals: ApprovalItem[] = [
  {
    id: "1",
    title: "GSTR-3B Draft - December 2024",
    description: "Monthly GST return ready for review and filing",
    type: "gstr",
    agent: "GST Agent",
    priority: "high",
    createdAt: "2 hours ago",
    dueDate: "Jan 20, 2025",
    status: "pending",
    details: { amount: "₹2,45,000", period: "Dec 2024", entries: 156 },
  },
  {
    id: "2",
    title: "ITC Reconciliation Report",
    description: "Mismatch found between GSTR-2B and purchase register",
    type: "gstr",
    agent: "GST Agent",
    priority: "high",
    createdAt: "4 hours ago",
    dueDate: "Jan 18, 2025",
    status: "pending",
    details: { amount: "₹45,230", entries: 12 },
  },
  {
    id: "3",
    title: "Advance Tax Computation - Q3",
    description: "Quarterly advance tax calculation based on current income",
    type: "itr",
    agent: "Income Tax Agent",
    priority: "medium",
    createdAt: "Yesterday",
    dueDate: "Jan 15, 2025",
    status: "pending",
    details: { amount: "₹1,25,000", period: "Q3 FY24-25" },
  },
  {
    id: "4",
    title: "Journal Entries - Bank Reconciliation",
    description: "Auto-classified transactions from HDFC bank statement",
    type: "journal",
    agent: "Accounting Agent",
    priority: "low",
    createdAt: "2 days ago",
    dueDate: "Jan 25, 2025",
    status: "pending",
    details: { entries: 89, amount: "₹15,67,000" },
  },
];

const typeConfig = {
  gstr: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  itr: { icon: Calculator, color: "text-blue-500", bg: "bg-blue-500/10" },
  journal: { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
  compliance: { icon: AlertTriangle, color: "text-green-500", bg: "bg-green-500/10" },
};

const priorityConfig = {
  high: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
  medium: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  low: { color: "text-muted-foreground", bg: "bg-secondary", border: "border-border" },
};

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [approvals, setApprovals] = useState(initialApprovals);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(item => 
      item.id === id ? { ...item, status: "approved" as const } : item
    ));
    toast.success("Approved successfully! The agent will proceed with filing.");
    setSelectedItem(null);
  };

  const handleReject = (id: string) => {
    setApprovals(prev => prev.map(item => 
      item.id === id ? { ...item, status: "rejected" as const } : item
    ));
    toast.info("Rejected. The agent will revise the draft.");
    setSelectedItem(null);
  };

  const pendingCount = approvals.filter(a => a.status === "pending").length;

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
                    <p className="text-2xl font-bold text-foreground">
                      {approvals.filter(a => a.status === "approved").length}
                    </p>
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
                    <p className="text-2xl font-bold text-foreground">
                      {approvals.filter(a => a.status === "rejected").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {approvals.filter(a => a.priority === "high" && a.status === "pending").length}
                    </p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
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
                {approvals.filter(a => a.status === "pending").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success" />
                    <p>All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  approvals
                    .filter(a => a.status === "pending")
                    .map((item) => {
                      const TypeIcon = typeConfig[item.type].icon;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-all",
                            priorityConfig[item.priority].border,
                            "bg-card hover:bg-secondary/30"
                          )}
                        >
                          {/* Type Icon */}
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig[item.type].bg)}>
                            <TypeIcon className={cn("w-5 h-5", typeConfig[item.type].color)} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                              <Badge variant={item.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>By {item.agent}</span>
                              <span>•</span>
                              <span>{item.createdAt}</span>
                              <span>•</span>
                              <span className={cn(item.priority === "high" && "text-destructive")}>
                                Due: {item.dueDate}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          {item.details && (
                            <div className="hidden md:flex items-center gap-4 text-sm">
                              {item.details.amount && (
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">{item.details.amount}</p>
                                  <p className="text-xs text-muted-foreground">Amount</p>
                                </div>
                              )}
                              {item.details.entries && (
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">{item.details.entries}</p>
                                  <p className="text-xs text-muted-foreground">Entries</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleReject(item.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90"
                              onClick={() => handleApprove(item.id)}
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
            {approvals.filter(a => a.status !== "pending").length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {approvals
                    .filter(a => a.status !== "pending")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                      >
                        {item.status === "approved" ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="flex-1 text-sm text-muted-foreground">{item.title}</span>
                        <Badge variant={item.status === "approved" ? "default" : "destructive"}>
                          {item.status}
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
