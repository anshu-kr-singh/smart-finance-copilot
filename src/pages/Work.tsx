import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileText, Receipt, Calculator, ClipboardCheck, Building2, LineChart, Shield, Briefcase, Download, Search, Calendar, CheckCircle2, Clock, AlertTriangle, Play } from "lucide-react";
import { generateWorkPDF } from "@/lib/pdfGenerator";

type WorkCategory = "accounting" | "gst" | "income_tax" | "audit" | "compliance" | "fpa" | "risk" | "advisory";
type WorkStatus = "draft" | "in_progress" | "review" | "completed" | "filed";

interface Client {
  id: string;
  company_name: string;
}

interface WorkItem {
  id: string;
  client_id: string;
  category: WorkCategory;
  title: string;
  description: string | null;
  status: WorkStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  clients: { company_name: string };
}

const categoryConfig: Record<WorkCategory, { label: string; icon: typeof FileText; color: string }> = {
  accounting: { label: "Accounting", icon: FileText, color: "bg-blue-500" },
  gst: { label: "GST", icon: Receipt, color: "bg-orange-500" },
  income_tax: { label: "Income Tax", icon: Calculator, color: "bg-green-500" },
  audit: { label: "Audit", icon: ClipboardCheck, color: "bg-purple-500" },
  compliance: { label: "Compliance", icon: Building2, color: "bg-cyan-500" },
  fpa: { label: "FP&A", icon: LineChart, color: "bg-amber-500" },
  risk: { label: "Risk", icon: Shield, color: "bg-red-500" },
  advisory: { label: "Advisory", icon: Briefcase, color: "bg-indigo-500" },
};

const statusConfig: Record<WorkStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "bg-secondary text-secondary-foreground", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-primary/20 text-primary", icon: Play },
  review: { label: "Review", color: "bg-warning/20 text-warning", icon: AlertTriangle },
  completed: { label: "Completed", color: "bg-success/20 text-success", icon: CheckCircle2 },
  filed: { label: "Filed", color: "bg-accent/20 text-accent", icon: CheckCircle2 },
};

export default function WorkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const clientFilter = searchParams.get("client");
  const { logActivity } = useActivityLog();
  const { createNotification } = useNotifications();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryTab, setCategoryTab] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: clientFilter || "",
    category: "" as WorkCategory | "",
    title: "",
    description: "",
    due_date: ""
  });

  useEffect(() => {
    fetchData();
  }, [clientFilter]);

  const fetchData = async () => {
    const [clientsRes, workRes] = await Promise.all([
      supabase.from("clients").select("id, company_name").order("company_name"),
      supabase.from("work_items").select("*, clients(company_name)").order("created_at", { ascending: false })
    ]);
    
    if (clientsRes.data) setClients(clientsRes.data);
    if (workRes.data) setWorkItems(workRes.data as WorkItem[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login first");
      return;
    }

    const { data, error } = await supabase.from("work_items").insert([{
      user_id: user.id,
      client_id: formData.client_id,
      category: formData.category as WorkCategory,
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null
    }]).select().single();
    
    if (error) {
      toast.error("Failed to create work item");
    } else {
      toast.success("Work item created!");
      await logActivity("create", "work_item", data.id, { name: formData.title, category: formData.category });
      await createNotification(
        "Work Item Created",
        `New ${categoryConfig[formData.category as WorkCategory]?.label || formData.category} work item: ${formData.title}`,
        "info",
        "work_item",
        data.id
      );
      fetchData();
      setDialogOpen(false);
      setFormData({ client_id: clientFilter || "", category: "", title: "", description: "", due_date: "" });
    }
  };

  const updateStatus = async (id: string, status: WorkStatus) => {
    const item = workItems.find(w => w.id === id);
    const updates: any = { status };
    if (status === "completed" || status === "filed") {
      updates.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase.from("work_items").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      if (item) {
        await logActivity("update", "work_item", id, { name: item.title, status });
        if (status === "completed" || status === "filed") {
          await createNotification(
            `Work Item ${status === "filed" ? "Filed" : "Completed"}`,
            `${item.title} has been marked as ${status}.`,
            "success",
            "work_item",
            id
          );
        }
      }
      fetchData();
    }
  };

  const handleDownloadPDF = async (item: WorkItem) => {
    await logActivity("download", "report", item.id, { name: item.title });
    toast.promise(
      generateWorkPDF(item, item.clients.company_name),
      {
        loading: "Generating PDF...",
        success: "PDF downloaded!",
        error: "Failed to generate PDF"
      }
    );
  };

  const filteredItems = workItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.clients.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryTab === "all" || item.category === categoryTab;
    const matchesClient = !clientFilter || item.client_id === clientFilter;
    return matchesSearch && matchesCategory && matchesClient;
  });

  const selectedClient = clients.find(c => c.id === clientFilter);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  {selectedClient ? `Work - ${selectedClient.company_name}` : "All Work"}
                </h1>
                <p className="text-muted-foreground">
                  Manage accounting, tax, audit, and compliance work
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />New Work Item</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Work Item</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })} required>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as WorkCategory })} required>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(categoryConfig).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., GSTR-1 Dec 2024" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional details" />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full">Create Work Item</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search work items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              {clientFilter && (
                <Button variant="outline" onClick={() => navigate("/work")}>Show All Clients</Button>
              )}
            </div>

            <Tabs value={categoryTab} onValueChange={setCategoryTab}>
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All</TabsTrigger>
                {Object.entries(categoryConfig).map(([key, { label }]) => (
                  <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading work items...</div>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No work items found. Create your first work item to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const cat = categoryConfig[item.category];
                  const stat = statusConfig[item.status];
                  const CatIcon = cat.icon;
                  const StatIcon = stat.icon;
                  
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                            <CatIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                              <Badge variant="outline" className={stat.color}>
                                <StatIcon className="w-3 h-3 mr-1" />
                                {stat.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{item.clients.company_name}</span>
                              <span>•</span>
                              <span>{cat.label}</span>
                              {item.due_date && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(item.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v as WorkStatus)}>
                              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => navigate(`/work/${item.id}`)}>
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDownloadPDF(item)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
