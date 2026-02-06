import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Shield, AlertTriangle, CheckCircle2, Clock, Calendar, FileCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/hooks/useActivityLog";

interface ComplianceTask {
  id: string;
  task_type: string;
  form_number: string | null;
  due_date: string | null;
  filed_date: string | null;
  srn: string | null;
  work_item_id: string;
  work_items: { 
    title: string; 
    status: string;
    clients: { company_name: string } 
  };
}

interface WorkItem {
  id: string;
  title: string;
  category: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  clients: { company_name: string };
}

export default function CompliancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [complianceTasks, setComplianceTasks] = useState<ComplianceTask[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [workRes, complianceRes] = await Promise.all([
      supabase
        .from("work_items")
        .select("*, clients(company_name)")
        .in("category", ["gst", "income_tax", "compliance"])
        .order("due_date", { ascending: true }),
      supabase
        .from("compliance_tasks")
        .select("*, work_items(title, status, clients(company_name))")
        .order("due_date", { ascending: true })
    ]);
    
    if (workRes.data) setWorkItems(workRes.data as WorkItem[]);
    if (complianceRes.data) setComplianceTasks(complianceRes.data as ComplianceTask[]);
    setLoading(false);
  };

  // Calculate compliance scores
  const calculateScores = () => {
    const byCategory: Record<string, { total: number; completed: number }> = {
      gst: { total: 0, completed: 0 },
      income_tax: { total: 0, completed: 0 },
      compliance: { total: 0, completed: 0 },
    };

    workItems.forEach(item => {
      if (byCategory[item.category]) {
        byCategory[item.category].total++;
        if (item.status === "completed" || item.status === "filed") {
          byCategory[item.category].completed++;
        }
      }
    });

    return {
      gst: byCategory.gst.total > 0 
        ? Math.round((byCategory.gst.completed / byCategory.gst.total) * 100) 
        : 100,
      income_tax: byCategory.income_tax.total > 0 
        ? Math.round((byCategory.income_tax.completed / byCategory.income_tax.total) * 100) 
        : 100,
      compliance: byCategory.compliance.total > 0 
        ? Math.round((byCategory.compliance.completed / byCategory.compliance.total) * 100) 
        : 100,
    };
  };

  const scores = calculateScores();
  const overallScore = Math.round((scores.gst + scores.income_tax + scores.compliance) / 3);

  // Calculate upcoming deadlines
  const now = new Date();
  const upcomingDeadlines = workItems
    .filter(item => item.due_date && item.status !== "completed" && item.status !== "filed")
    .map(item => {
      const dueDate = new Date(item.due_date!);
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        daysLeft,
        status: daysLeft < 0 ? "overdue" : daysLeft <= 7 ? "urgent" : "upcoming"
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10);

  // Recent filings
  const recentFilings = workItems
    .filter(item => item.status === "filed" || item.status === "completed")
    .slice(0, 5);

  const complianceAreas = [
    { name: "GST Compliance", score: scores.gst, status: scores.gst >= 90 ? "good" : scores.gst >= 75 ? "attention" : "critical" },
    { name: "Income Tax", score: scores.income_tax, status: scores.income_tax >= 90 ? "excellent" : scores.income_tax >= 75 ? "good" : "attention" },
    { name: "ROC/Statutory", score: scores.compliance, status: scores.compliance >= 90 ? "good" : scores.compliance >= 75 ? "attention" : "critical" },
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
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Compliance Dashboard
              </h1>
              <p className="text-muted-foreground">
                Track deadlines, filings, and compliance health across all areas
              </p>
            </div>

            {/* Overall Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-secondary"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(overallScore / 100) * 352} 352`}
                        className={cn(
                          overallScore >= 90 ? "text-success" :
                          overallScore >= 75 ? "text-warning" : "text-destructive"
                        )}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{overallScore}%</span>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Overall Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    {overallScore >= 90 ? "Excellent standing" :
                     overallScore >= 75 ? "Good standing" : "Needs attention"}
                  </p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Compliance Areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complianceAreas.map((area) => (
                    <div key={area.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{area.name}</span>
                        <span className={cn(
                          "text-sm font-semibold",
                          area.score >= 90 ? "text-success" :
                          area.score >= 75 ? "text-warning" : "text-destructive"
                        )}>
                          {area.score}%
                        </span>
                      </div>
                      <Progress 
                        value={area.score} 
                        className={cn(
                          "h-2",
                          area.score >= 90 ? "[&>div]:bg-success" :
                          area.score >= 75 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                        )}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
                    <p>No pending deadlines</p>
                    <p className="text-sm">Create work items with due dates to track compliance</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/work/${item.id}`)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-secondary/30",
                        item.status === "overdue" 
                          ? "border-destructive/30 bg-destructive/5"
                          : item.status === "urgent"
                            ? "border-warning/30 bg-warning/5"
                            : "border-border"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.status === "overdue" 
                          ? "bg-destructive/10"
                          : item.status === "urgent"
                            ? "bg-warning/10"
                            : "bg-primary/10"
                      )}>
                        {item.status === "overdue" ? (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : (
                          <Clock className={cn(
                            "w-5 h-5",
                            item.status === "urgent" ? "text-warning" : "text-primary"
                          )} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.clients?.company_name} • Due: {new Date(item.due_date!).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <Badge variant={
                        item.status === "overdue" ? "destructive" :
                        item.status === "urgent" ? "default" : "secondary"
                      }>
                        {item.status === "overdue" 
                          ? `${Math.abs(item.daysLeft)} days overdue`
                          : `${item.daysLeft} days left`}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Filings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Recent Filings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentFilings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent filings</p>
                    <p className="text-sm">Completed work items will appear here</p>
                  </div>
                ) : (
                  recentFilings.map((filing) => (
                    <div
                      key={filing.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{filing.title}</span>
                        <p className="text-xs text-muted-foreground">{filing.clients?.company_name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {filing.completed_at ? formatRelativeTime(filing.completed_at) : ""}
                      </span>
                      <Badge variant="outline" className="text-success border-success/30">
                        {filing.status === "filed" ? "Filed" : "Completed"}
                      </Badge>
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
