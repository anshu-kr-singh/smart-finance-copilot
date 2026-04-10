import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatRelativeTime } from "@/hooks/useActivityLog";

interface Report {
  id: string;
  title: string;
  description: string | null;
  report_type: string;
  period: string | null;
  file_size: string | null;
  created_at: string;
  client_id: string | null;
}

interface Client {
  id: string;
  company_name: string;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { stats, formatCurrency } = useDashboardStats();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    report_type: "",
    client_id: "",
    period: "",
    title: ""
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [reportsRes, clientsRes] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, company_name")
    ]);
    
    if (reportsRes.data) setReports(reportsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setGenerating(true);
    
    // Simulate report generation
    const title = formData.title || `${formData.report_type} - ${formData.period || new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
    
    const { data, error } = await supabase.from("reports").insert({
      user_id: user.id,
      client_id: formData.client_id || null,
      title,
      description: `Generated ${formData.report_type} report`,
      report_type: formData.report_type,
      period: formData.period,
      file_size: `${Math.floor(Math.random() * 900 + 100)} KB`
    }).select().single();
    
    if (error) {
      toast.error("Failed to generate report");
    } else {
      toast.success("Report generated successfully!");
      await logActivity("create", "report", data.id, { name: title });
      fetchData();
      setDialogOpen(false);
      setFormData({ report_type: "", client_id: "", period: "", title: "" });
    }
    
    setGenerating(false);
  };

  const handleDownload = async (report: Report) => {
    toast.success(`Downloading ${report.title}...`);
    await logActivity("download", "report", report.id, { name: report.title });
    // In real implementation, this would download the actual file
  };

  const summaryStats = [
    { 
      label: "Total Tax (GST)", 
      value: stats ? formatCurrency(stats.gstReturns.totalTax) : "₹0", 
      change: stats?.gstReturns.filed || 0, 
      trend: "up" as const 
    },
    { 
      label: "IT Liability", 
      value: stats ? formatCurrency(stats.incomeTax.totalLiability) : "₹0", 
      change: stats?.incomeTax.computations || 0, 
      trend: "up" as const 
    },
    { 
      label: "Work Items", 
      value: (stats?.activeWorkItems || 0).toString(), 
      change: stats?.completedThisMonth || 0, 
      trend: "up" as const 
    },
    { 
      label: "Compliance", 
      value: `${stats?.complianceScore || 100}%`, 
      change: 0, 
      trend: "up" as const 
    },
  ];

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Reports
                </h1>
                <p className="text-muted-foreground">
                  View and download AI-generated financial and compliance reports
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={generateReport} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Report Type *</Label>
                      <Select 
                        value={formData.report_type} 
                        onValueChange={(v) => setFormData({ ...formData, report_type: v })}
                        required
                      >
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GST Summary">GST Summary</SelectItem>
                          <SelectItem value="Income Tax">Income Tax Computation</SelectItem>
                          <SelectItem value="P&L Statement">Profit & Loss Statement</SelectItem>
                          <SelectItem value="Balance Sheet">Balance Sheet</SelectItem>
                          <SelectItem value="ITC Reconciliation">ITC Reconciliation</SelectItem>
                          <SelectItem value="TDS Summary">TDS Summary</SelectItem>
                          <SelectItem value="Audit Report">Audit Report</SelectItem>
                          <SelectItem value="Compliance Report">Compliance Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Client (Optional)</Label>
                      <Select 
                        value={formData.client_id} 
                        onValueChange={(v) => setFormData({ ...formData, client_id: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="All clients" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All clients</SelectItem>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Input 
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        placeholder="e.g., Dec 2024, Q3 FY24-25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Title (Optional)</Label>
                      <Input 
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Report"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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
                        {stat.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:bg-secondary/30 transition-colors"
                onClick={() => {
                  setFormData({ ...formData, report_type: "GST Summary" });
                  setDialogOpen(true);
                }}
              >
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
              <Card className="cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => navigate("/")}>
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
                <CardTitle>Generated Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No reports generated yet</p>
                    <p className="text-sm">Click "Generate Report" to create your first report</p>
                  </div>
                ) : (
                  reports.map((report) => (
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
                          <span>{report.report_type}</span>
                          {report.period && (
                            <>
                              <span>•</span>
                              <span>{report.period}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatRelativeTime(report.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{report.file_size}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
