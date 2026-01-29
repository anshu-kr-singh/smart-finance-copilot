import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Receipt,
  Calculator,
  ClipboardCheck,
  Building2,
  LineChart,
  BookOpen,
} from "lucide-react";

const agents = [
  {
    name: "GST Agent",
    description: "GSTR-1, 2B matching, ITC reconciliation, and return filing automation",
    icon: Receipt,
    status: "processing" as const,
    tasksCompleted: 8,
    tasksTotal: 12,
    lastRun: "5 min ago",
    variant: "gst" as const,
  },
  {
    name: "Income Tax Agent",
    description: "AIS reconciliation, tax computation, ITR draft generation",
    icon: Calculator,
    status: "active" as const,
    tasksCompleted: 15,
    tasksTotal: 15,
    lastRun: "2 hours ago",
    variant: "tax" as const,
  },
  {
    name: "Audit Assistant",
    description: "Risk-based sampling, anomaly detection, evidence management",
    icon: ClipboardCheck,
    status: "idle" as const,
    tasksCompleted: 0,
    tasksTotal: 5,
    lastRun: "Yesterday",
    variant: "audit" as const,
  },
  {
    name: "Compliance & ROC",
    description: "Deadline tracking, form drafting, regulatory compliance",
    icon: Building2,
    status: "alert" as const,
    tasksCompleted: 3,
    tasksTotal: 4,
    lastRun: "30 min ago",
    variant: "compliance" as const,
  },
  {
    name: "Accounting Agent",
    description: "Transaction classification, journal entries, reconciliation",
    icon: BookOpen,
    status: "active" as const,
    tasksCompleted: 142,
    tasksTotal: 150,
    lastRun: "1 hour ago",
    variant: "accounting" as const,
  },
  {
    name: "FP&A / Advisory",
    description: "Budget analysis, forecasting, scenario planning, insights",
    icon: LineChart,
    status: "idle" as const,
    tasksCompleted: 2,
    tasksTotal: 3,
    lastRun: "3 days ago",
    variant: "advisory" as const,
  },
];

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                AI Agents
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage your AI-powered tax and accounting agents
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.name} {...agent} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
