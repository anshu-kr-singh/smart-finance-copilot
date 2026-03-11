import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { QueryInterface } from "@/components/dashboard/QueryInterface";
import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import { UploadCard } from "@/components/dashboard/UploadCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UsageBanner } from "@/components/subscription/UsageBanner";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSubscription } from "@/hooks/useSubscription";
import {
  IndianRupee,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Calculator,
  ClipboardCheck,
  Building2,
  LineChart,
  BookOpen,
  Users,
  Briefcase,
} from "lucide-react";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

import { useAgentStats } from "@/hooks/useAgentStats";

const getAgentConfigs = (getAgentStats: (type: string) => any, getAgentStatus: (stats: any) => string, formatLastRun: (date: string | null) => string) => [
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
].map(config => {
  const stats = getAgentStats(config.agentType);
  return {
    ...config,
    tasksCompleted: stats.completed,
    tasksTotal: stats.total,
    status: getAgentStatus(stats) as "active" | "processing" | "idle" | "alert",
    lastRun: formatLastRun(stats.lastActivity),
  };
});

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getGreeting, getFirstName } = useProfile();
  const { stats, loading: statsLoading, formatCurrency } = useDashboardStats();
  const { subscription, getRemainingWorkItems } = useSubscription();
  const { getAgentStats, getAgentStatus, formatLastRun } = useAgentStats();

  const remainingItems = getRemainingWorkItems();
  
  // Get agents with real data
  const agents = getAgentConfigs(getAgentStats, getAgentStatus, formatLastRun);

  const dynamicStats = [
    {
      title: "Total Clients",
      value: stats?.totalClients?.toString() || "0",
      change: { value: 0, label: "managed" },
      icon: Users,
      variant: "primary" as const,
    },
    {
      title: "Active Work Items",
      value: stats?.activeWorkItems?.toString() || "0",
      change: { value: stats?.completedThisMonth || 0, label: "completed this month" },
      icon: FileCheck,
      variant: "success" as const,
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals?.toString() || "0",
      change: { value: 0, label: "require attention" },
      icon: AlertTriangle,
      variant: "warning" as const,
    },
    {
      title: "Compliance Score",
      value: `${stats?.complianceScore || 100}%`,
      change: { value: 0, label: "on track" },
      icon: TrendingUp,
      variant: "accent" as const,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Usage Banner */}
            <UsageBanner />

            {/* Welcome Section */}
            <div className="mb-8 flex items-center gap-4">
              <img 
                src={asrofyzLogo} 
                alt="Asrofyz CA" 
                className="w-16 h-16 object-contain rounded-lg shadow-lg hidden md:block"
              />
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  {getGreeting()}, {getFirstName()} 👋
                </h1>
                <p className="text-muted-foreground">
                  Your AI agents are ready to help. Here's an overview of your practice.
                  {subscription?.plan === "free" && typeof remainingItems === "number" && (
                    <span className="ml-2 text-primary font-medium">
                      ({remainingItems} free work items remaining)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dynamicStats.map((stat) => (
                <StatsCard key={stat.title} {...stat} />
              ))}
            </div>

            {/* Tax Summary Cards */}
            {stats && (stats.gstReturns.totalTax > 0 || stats.incomeTax.totalLiability > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">GST Summary</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Filed</p>
                      <p className="text-lg font-bold text-success">{stats.gstReturns.filed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-warning">{stats.gstReturns.pending}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Tax</p>
                      <p className="text-lg font-bold">{formatCurrency(stats.gstReturns.totalTax)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Calculator className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Income Tax Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Computations</p>
                      <p className="text-lg font-bold">{stats.incomeTax.computations}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Liability</p>
                      <p className="text-lg font-bold">{formatCurrency(stats.incomeTax.totalLiability)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Query Interface */}
            <QueryInterface />

            {/* Agents Grid */}
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                Your AI Agents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.name} {...agent} />
                ))}
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Approval Queue */}
              <div className="lg:col-span-2">
                <ApprovalQueue />
              </div>

              {/* Upload Card */}
              <div>
                <UploadCard />
              </div>
            </div>

            {/* Recent Activity - Real-time */}
            <ActivityFeed maxItems={10} />
          </div>
        </main>
      </div>
    </div>
  );
}
