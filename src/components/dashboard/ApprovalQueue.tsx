import { FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Approval {
  id: string;
  type: string;
  title: string;
  amount?: string;
  priority: "high" | "medium" | "low";
  agent: string;
  createdAt: string;
}

const approvals: Approval[] = [
  {
    id: "1",
    type: "GST Return",
    title: "GSTR-3B December 2024",
    amount: "₹45,230",
    priority: "high",
    agent: "GST Agent",
    createdAt: "10 min ago",
  },
  {
    id: "2",
    type: "Journal Entry",
    title: "Depreciation - Q3 FY24",
    amount: "₹1,25,000",
    priority: "medium",
    agent: "Accounting Agent",
    createdAt: "2 hours ago",
  },
  {
    id: "3",
    type: "Tax Computation",
    title: "Advance Tax Q4",
    amount: "₹2,34,000",
    priority: "high",
    agent: "Income Tax Agent",
    createdAt: "5 hours ago",
  },
];

const priorityStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

export function ApprovalQueue() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-semibold text-foreground">Pending Approvals</h3>
            <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-full">
              {approvals.length} pending
            </span>
          </div>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {approvals.map((approval) => (
          <div key={approval.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 text-xs font-medium rounded border mb-1",
                        priorityStyles[approval.priority]
                      )}
                    >
                      {approval.priority.toUpperCase()}
                    </span>
                    <p className="font-medium text-foreground">{approval.title}</p>
                  </div>
                  {approval.amount && (
                    <span className="text-lg font-display font-bold text-foreground">
                      {approval.amount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs">{approval.type}</span>
                  <span>•</span>
                  <span>{approval.agent}</span>
                  <span>•</span>
                  <span>{approval.createdAt}</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button variant="success" size="sm" className="gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Eye className="w-4 h-4" />
                    Review
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
