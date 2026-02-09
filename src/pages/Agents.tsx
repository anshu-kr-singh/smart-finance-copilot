import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { useNavigate, useLocation } from "react-router-dom";
import { useAgentStats } from "@/hooks/useAgentStats";
import { Loader2 } from "lucide-react";
import {
  Receipt,
  Calculator,
  ClipboardCheck,
  Building2,
  LineChart,
  BookOpen,
} from "lucide-react";

const agentConfigs = [
  {
    name: "GST Agent",
    description: "GSTR-1, 2B matching, ITC reconciliation, and return filing automation",
    icon: Receipt,
    variant: "gst" as const,
    agentType: "gst",
  },
  {
    name: "Income Tax Agent",
    description: "AIS reconciliation, tax computation, ITR draft generation",
    icon: Calculator,
    variant: "tax" as const,
    agentType: "incometax",
  },
  {
    name: "Audit Assistant",
    description: "Risk-based sampling, anomaly detection, evidence management",
    icon: ClipboardCheck,
    variant: "audit" as const,
    agentType: "audit",
  },
  {
    name: "Compliance & ROC",
    description: "Deadline tracking, form drafting, regulatory compliance",
    icon: Building2,
    variant: "compliance" as const,
    agentType: "compliance",
  },
  {
    name: "Accounting Agent",
    description: "Transaction classification, journal entries, reconciliation",
    icon: BookOpen,
    variant: "accounting" as const,
    agentType: "accounting",
  },
  {
    name: "FP&A / Advisory",
    description: "Budget analysis, forecasting, scenario planning, insights",
    icon: LineChart,
    variant: "advisory" as const,
    agentType: "advisory",
  },
];

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAgentStats, formatLastRun, getAgentStatus, isLoading } = useAgentStats();

  const agents = agentConfigs.map(config => {
    const stats = getAgentStats(config.agentType);
    return {
      ...config,
      tasksCompleted: stats.completed,
      tasksTotal: stats.total,
      status: getAgentStatus(stats),
      lastRun: formatLastRun(stats.lastActivity),
    };
  });

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

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <AgentCard key={agent.name} {...agent} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}