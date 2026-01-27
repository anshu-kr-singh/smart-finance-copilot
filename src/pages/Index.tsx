import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { QueryInterface } from "@/components/dashboard/QueryInterface";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ApprovalQueue } from "@/components/dashboard/ApprovalQueue";
import { UploadCard } from "@/components/dashboard/UploadCard";
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
} from "lucide-react";

const stats = [
  {
    title: "Total Tax Saved",
    value: "₹24.5L",
    change: { value: 12, label: "vs last year" },
    icon: IndianRupee,
    variant: "primary" as const,
  },
  {
    title: "Returns Filed",
    value: "156",
    change: { value: 8, label: "this quarter" },
    icon: FileCheck,
    variant: "success" as const,
  },
  {
    title: "Pending Actions",
    value: "7",
    change: { value: -23, label: "vs last week" },
    icon: AlertTriangle,
    variant: "warning" as const,
  },
  {
    title: "Compliance Score",
    value: "98%",
    change: { value: 3, label: "improvement" },
    icon: TrendingUp,
    variant: "accent" as const,
  },
];

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

export default function Index() {
  const [activeNav, setActiveNav] = useState("/");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Good Morning, Rahul 👋
              </h1>
              <p className="text-muted-foreground">
                Your AI agents have been busy. Here's what needs your attention today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <StatsCard key={stat.title} {...stat} />
              ))}
            </div>

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

            {/* Recent Activity */}
            <RecentActivity />
          </div>
        </main>
      </div>
    </div>
  );
}
