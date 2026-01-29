import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const reports = [
  {
    id: "1",
    title: "GST Summary Report",
    description: "Monthly GST liability and ITC summary",
    type: "GST",
    period: "Dec 2024",
    generated: "2 hours ago",
    size: "245 KB",
  },
  {
    id: "2",
    title: "Profit & Loss Statement",
    description: "Quarterly P&L with expense breakdown",
    type: "Financial",
    period: "Q3 FY24-25",
    generated: "1 day ago",
    size: "1.2 MB",
  },
  {
    id: "3",
    title: "Tax Computation Sheet",
    description: "Advance tax calculation workings",
    type: "Income Tax",
    period: "FY 2024-25",
    generated: "3 days ago",
    size: "890 KB",
  },
  {
    id: "4",
    title: "ITC Reconciliation",
    description: "GSTR-2B vs Purchase Register matching",
    type: "GST",
    period: "Dec 2024",
    generated: "4 hours ago",
    size: "567 KB",
  },
  {
    id: "5",
    title: "TDS Summary",
    description: "TDS deducted and deposited summary",
    type: "TDS",
    period: "Q3 FY24-25",
    generated: "2 days ago",
    size: "345 KB",
  },
];

const summaryStats = [
  { label: "Total Tax Paid", value: "₹45.2L", change: 12, trend: "up" },
  { label: "ITC Claimed", value: "₹18.7L", change: 8, trend: "up" },
  { label: "Pending Refunds", value: "₹2.3L", change: -15, trend: "down" },
  { label: "Compliance Score", value: "98%", change: 3, trend: "up" },
];

export default function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();

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
                Reports
              </h1>
              <p className="text-muted-foreground">
                View and download AI-generated financial and compliance reports
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {summaryStats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        stat.trend === "up" ? "text-success" : "text-destructive"
                      )}>
                        {stat.trend === "up" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(stat.change)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:bg-secondary/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Generate Custom Report</h3>
                    <p className="text-sm text-muted-foreground">Create a tailored report</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-secondary/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Analytics Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Visual insights & trends</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-secondary/30 transition-colors">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Schedule Reports</h3>
                    <p className="text-sm text-muted-foreground">Automate report generation</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground">{report.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">{report.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{report.type}</span>
                        <span>•</span>
                        <span>{report.period}</span>
                        <span>•</span>
                        <span>{report.generated}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{report.size}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
