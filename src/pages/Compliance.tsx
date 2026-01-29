import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, AlertTriangle, CheckCircle2, Clock, Calendar, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const upcomingDeadlines = [
  {
    id: "1",
    title: "GSTR-3B Filing",
    dueDate: "Jan 20, 2025",
    daysLeft: 5,
    status: "pending",
    priority: "high",
  },
  {
    id: "2",
    title: "Advance Tax Q4",
    dueDate: "Mar 15, 2025",
    daysLeft: 59,
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "3",
    title: "TDS Return Q3",
    dueDate: "Jan 31, 2025",
    daysLeft: 16,
    status: "pending",
    priority: "high",
  },
  {
    id: "4",
    title: "Annual ROC Filing",
    dueDate: "Feb 28, 2025",
    daysLeft: 44,
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "5",
    title: "GSTR-1 Filing",
    dueDate: "Jan 11, 2025",
    daysLeft: -4,
    status: "overdue",
    priority: "critical",
  },
];

const complianceAreas = [
  { name: "GST Compliance", score: 95, status: "good" },
  { name: "Income Tax", score: 100, status: "excellent" },
  { name: "TDS Compliance", score: 88, status: "good" },
  { name: "ROC Filings", score: 75, status: "attention" },
];

const recentFilings = [
  { title: "GSTR-1 November 2024", date: "Dec 11, 2024", status: "filed" },
  { title: "GSTR-3B November 2024", date: "Dec 20, 2024", status: "filed" },
  { title: "TDS Return Q2", date: "Oct 31, 2024", status: "filed" },
  { title: "Advance Tax Q3", date: "Dec 15, 2024", status: "filed" },
];

export default function CompliancePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const overallScore = Math.round(
    complianceAreas.reduce((acc, area) => acc + area.score, 0) / complianceAreas.length
  );

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
                        className="text-success"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-foreground">{overallScore}%</span>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">Overall Compliance</h3>
                  <p className="text-sm text-muted-foreground">Excellent standing</p>
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
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      deadline.status === "overdue" 
                        ? "border-destructive/30 bg-destructive/5"
                        : deadline.daysLeft <= 7 
                          ? "border-warning/30 bg-warning/5"
                          : "border-border"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      deadline.status === "overdue" 
                        ? "bg-destructive/10"
                        : deadline.daysLeft <= 7 
                          ? "bg-warning/10"
                          : "bg-primary/10"
                    )}>
                      {deadline.status === "overdue" ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <Clock className={cn(
                          "w-5 h-5",
                          deadline.daysLeft <= 7 ? "text-warning" : "text-primary"
                        )} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{deadline.title}</h4>
                      <p className="text-sm text-muted-foreground">Due: {deadline.dueDate}</p>
                    </div>
                    <Badge variant={
                      deadline.status === "overdue" ? "destructive" :
                      deadline.daysLeft <= 7 ? "default" : "secondary"
                    }>
                      {deadline.status === "overdue" 
                        ? `${Math.abs(deadline.daysLeft)} days overdue`
                        : `${deadline.daysLeft} days left`}
                    </Badge>
                  </div>
                ))}
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
                {recentFilings.map((filing, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{filing.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{filing.date}</span>
                    <Badge variant="outline" className="text-success border-success/30">
                      Filed
                    </Badge>
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
