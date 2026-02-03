import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus, Trash2, Save } from "lucide-react";
import { generateWorkPDF } from "@/lib/pdfGenerator";

type WorkCategory = "accounting" | "gst" | "income_tax" | "audit" | "compliance" | "fpa" | "risk" | "advisory";

interface WorkItem {
  id: string;
  client_id: string;
  category: WorkCategory;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  data: any;
  created_at: string;
  clients: { company_name: string; gstin: string | null; pan: string | null };
}

export default function WorkDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const [workItem, setWorkItem] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // GST Return fields
  const [gstData, setGstData] = useState({
    return_type: "GSTR-1",
    period: "",
    taxable_value: 0,
    igst: 0,
    cgst: 0,
    sgst: 0,
    itc_claimed: 0,
    arn: ""
  });
  
  // Income Tax fields
  const [itData, setItData] = useState({
    assessment_year: "2024-25",
    gross_income: 0,
    deductions_80c: 0,
    deductions_80d: 0,
    other_deductions: 0,
    tds_credit: 0,
    advance_tax_paid: 0
  });
  
  // Journal entries
  const [entries, setEntries] = useState<any[]>([]);
  const [newEntry, setNewEntry] = useState({ entry_date: "", debit_account: "", credit_account: "", amount: 0, narration: "" });
  
  // Compliance tasks
  const [complianceData, setComplianceData] = useState({
    task_type: "",
    form_number: "",
    due_date: "",
    srn: "",
    remarks: ""
  });
  
  // Audit findings
  const [findings, setFindings] = useState<any[]>([]);
  const [newFinding, setNewFinding] = useState({ area: "", description: "", risk_level: "medium", recommendation: "" });

  useEffect(() => {
    fetchWorkItem();
  }, [id]);

  const fetchWorkItem = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from("work_items")
      .select("*, clients(company_name, gstin, pan)")
      .eq("id", id)
      .maybeSingle();
    
    if (error || !data) {
      toast.error("Work item not found");
      navigate("/work");
      return;
    }
    
    setWorkItem(data as WorkItem);
    
    // Load category-specific data
    if (data.category === "gst") {
      const { data: gstReturn } = await supabase.from("gst_returns").select("*").eq("work_item_id", id).maybeSingle();
      if (gstReturn) setGstData(gstReturn as any);
    } else if (data.category === "income_tax") {
      const { data: itComp } = await supabase.from("income_tax_computations").select("*").eq("work_item_id", id).maybeSingle();
      if (itComp) setItData(itComp as any);
    } else if (data.category === "accounting") {
      const { data: journalEntries } = await supabase.from("journal_entries").select("*").eq("work_item_id", id).order("entry_date");
      if (journalEntries) setEntries(journalEntries);
    } else if (data.category === "compliance") {
      const { data: compTask } = await supabase.from("compliance_tasks").select("*").eq("work_item_id", id).maybeSingle();
      if (compTask) setComplianceData(compTask as any);
    } else if (data.category === "audit") {
      const { data: auditFindings } = await supabase.from("audit_findings").select("*").eq("work_item_id", id);
      if (auditFindings) setFindings(auditFindings);
    }
    
    setLoading(false);
  };

  const saveGSTData = async () => {
    if (!workItem) return;
    setSaving(true);
    
    const total_tax = Number(gstData.igst) + Number(gstData.cgst) + Number(gstData.sgst);
    const net_payable = total_tax - Number(gstData.itc_claimed);
    
    const { data: existing } = await supabase.from("gst_returns").select("id").eq("work_item_id", workItem.id).maybeSingle();
    
    if (existing) {
      await supabase.from("gst_returns").update({ ...gstData, total_tax, net_payable }).eq("id", existing.id);
    } else {
      await supabase.from("gst_returns").insert({ work_item_id: workItem.id, ...gstData, total_tax, net_payable });
    }
    
    toast.success("GST data saved!");
    setSaving(false);
  };

  const saveITData = async () => {
    if (!workItem) return;
    setSaving(true);
    
    const totalDeductions = Number(itData.deductions_80c) + Number(itData.deductions_80d) + Number(itData.other_deductions);
    const taxable_income = Math.max(0, Number(itData.gross_income) - totalDeductions);
    const tax_liability = calculateIncomeTax(taxable_income);
    const refund_due = Number(itData.tds_credit) + Number(itData.advance_tax_paid) - tax_liability;
    
    const { data: existing } = await supabase.from("income_tax_computations").select("id").eq("work_item_id", workItem.id).maybeSingle();
    
    const deductions = { "80C": itData.deductions_80c, "80D": itData.deductions_80d, "Other": itData.other_deductions };
    
    if (existing) {
      await supabase.from("income_tax_computations").update({ 
        assessment_year: itData.assessment_year, 
        gross_income: itData.gross_income, 
        deductions, 
        taxable_income, 
        tax_liability, 
        tds_credit: itData.tds_credit, 
        advance_tax_paid: itData.advance_tax_paid,
        refund_due 
      }).eq("id", existing.id);
    } else {
      await supabase.from("income_tax_computations").insert({ 
        work_item_id: workItem.id, 
        assessment_year: itData.assessment_year, 
        gross_income: itData.gross_income, 
        deductions, 
        taxable_income, 
        tax_liability, 
        tds_credit: itData.tds_credit, 
        advance_tax_paid: itData.advance_tax_paid,
        refund_due 
      });
    }
    
    toast.success("Income Tax data saved!");
    setSaving(false);
  };

  const calculateIncomeTax = (income: number) => {
    // Simplified new regime calculation
    if (income <= 300000) return 0;
    if (income <= 700000) return (income - 300000) * 0.05;
    if (income <= 1000000) return 20000 + (income - 700000) * 0.10;
    if (income <= 1200000) return 50000 + (income - 1000000) * 0.15;
    if (income <= 1500000) return 80000 + (income - 1200000) * 0.20;
    return 140000 + (income - 1500000) * 0.30;
  };

  const addJournalEntry = async () => {
    if (!workItem || !newEntry.entry_date || !newEntry.debit_account || !newEntry.credit_account || !newEntry.amount) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const { error } = await supabase.from("journal_entries").insert({
      work_item_id: workItem.id,
      ...newEntry,
      entry_number: `JE-${Date.now()}`
    });
    
    if (error) {
      toast.error("Failed to add entry");
    } else {
      toast.success("Entry added!");
      setNewEntry({ entry_date: "", debit_account: "", credit_account: "", amount: 0, narration: "" });
      fetchWorkItem();
    }
  };

  const deleteEntry = async (entryId: string) => {
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);
    if (!error) {
      toast.success("Entry deleted");
      fetchWorkItem();
    }
  };

  const saveComplianceData = async () => {
    if (!workItem) return;
    setSaving(true);
    
    const { data: existing } = await supabase.from("compliance_tasks").select("id").eq("work_item_id", workItem.id).maybeSingle();
    
    if (existing) {
      await supabase.from("compliance_tasks").update(complianceData).eq("id", existing.id);
    } else {
      await supabase.from("compliance_tasks").insert({ work_item_id: workItem.id, ...complianceData });
    }
    
    toast.success("Compliance data saved!");
    setSaving(false);
  };

  const addFinding = async () => {
    if (!workItem || !newFinding.area || !newFinding.description) {
      toast.error("Please fill required fields");
      return;
    }
    
    const { error } = await supabase.from("audit_findings").insert({
      work_item_id: workItem.id,
      finding_type: "observation",
      ...newFinding
    });
    
    if (error) {
      toast.error("Failed to add finding");
    } else {
      toast.success("Finding added!");
      setNewFinding({ area: "", description: "", risk_level: "medium", recommendation: "" });
      fetchWorkItem();
    }
  };

  const handleDownloadPDF = async () => {
    if (!workItem) return;
    const pdfItem = {
      ...workItem,
      created_at: workItem.created_at
    };
    toast.promise(
      generateWorkPDF(pdfItem, workItem.clients.company_name),
      { loading: "Generating PDF...", success: "PDF downloaded!", error: "Failed to generate PDF" }
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!workItem) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/work")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">{workItem.title}</h1>
                  <p className="text-muted-foreground">{workItem.clients.company_name}</p>
                </div>
              </div>
              <Button onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Client Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-muted-foreground">Company:</span> {workItem.clients.company_name}</div>
                <div><span className="text-muted-foreground">GSTIN:</span> {workItem.clients.gstin || "N/A"}</div>
                <div><span className="text-muted-foreground">PAN:</span> {workItem.clients.pan || "N/A"}</div>
              </CardContent>
            </Card>

            {/* GST Category */}
            {workItem.category === "gst" && (
              <Card>
                <CardHeader>
                  <CardTitle>GST Return Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Return Type</Label>
                      <Select value={gstData.return_type} onValueChange={(v) => setGstData({ ...gstData, return_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GSTR-1">GSTR-1</SelectItem>
                          <SelectItem value="GSTR-3B">GSTR-3B</SelectItem>
                          <SelectItem value="GSTR-2B">GSTR-2B</SelectItem>
                          <SelectItem value="GSTR-9">GSTR-9</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Input value={gstData.period} onChange={(e) => setGstData({ ...gstData, period: e.target.value })} placeholder="Dec 2024" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Taxable Value (₹)</Label>
                      <Input type="number" value={gstData.taxable_value} onChange={(e) => setGstData({ ...gstData, taxable_value: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>IGST (₹)</Label>
                      <Input type="number" value={gstData.igst} onChange={(e) => setGstData({ ...gstData, igst: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>CGST (₹)</Label>
                      <Input type="number" value={gstData.cgst} onChange={(e) => setGstData({ ...gstData, cgst: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>SGST (₹)</Label>
                      <Input type="number" value={gstData.sgst} onChange={(e) => setGstData({ ...gstData, sgst: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ITC Claimed (₹)</Label>
                      <Input type="number" value={gstData.itc_claimed} onChange={(e) => setGstData({ ...gstData, itc_claimed: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ARN (after filing)</Label>
                      <Input value={gstData.arn} onChange={(e) => setGstData({ ...gstData, arn: e.target.value })} placeholder="AA1234567890123" />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tax: ₹{(Number(gstData.igst) + Number(gstData.cgst) + Number(gstData.sgst)).toLocaleString()}</p>
                        <p className="text-lg font-semibold">Net Payable: ₹{(Number(gstData.igst) + Number(gstData.cgst) + Number(gstData.sgst) - Number(gstData.itc_claimed)).toLocaleString()}</p>
                      </div>
                      <Button onClick={saveGSTData} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Income Tax Category */}
            {workItem.category === "income_tax" && (
              <Card>
                <CardHeader>
                  <CardTitle>Income Tax Computation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assessment Year</Label>
                      <Select value={itData.assessment_year} onValueChange={(v) => setItData({ ...itData, assessment_year: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">AY 2024-25</SelectItem>
                          <SelectItem value="2025-26">AY 2025-26</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gross Income (₹)</Label>
                      <Input type="number" value={itData.gross_income} onChange={(e) => setItData({ ...itData, gross_income: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Deductions u/s 80C (₹)</Label>
                      <Input type="number" value={itData.deductions_80c} onChange={(e) => setItData({ ...itData, deductions_80c: Number(e.target.value) })} max={150000} />
                    </div>
                    <div className="space-y-2">
                      <Label>Deductions u/s 80D (₹)</Label>
                      <Input type="number" value={itData.deductions_80d} onChange={(e) => setItData({ ...itData, deductions_80d: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Deductions (₹)</Label>
                      <Input type="number" value={itData.other_deductions} onChange={(e) => setItData({ ...itData, other_deductions: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>TDS Credit (₹)</Label>
                      <Input type="number" value={itData.tds_credit} onChange={(e) => setItData({ ...itData, tds_credit: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Advance Tax Paid (₹)</Label>
                      <Input type="number" value={itData.advance_tax_paid} onChange={(e) => setItData({ ...itData, advance_tax_paid: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Taxable Income: ₹{Math.max(0, Number(itData.gross_income) - Number(itData.deductions_80c) - Number(itData.deductions_80d) - Number(itData.other_deductions)).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Tax Liability: ₹{calculateIncomeTax(Math.max(0, Number(itData.gross_income) - Number(itData.deductions_80c) - Number(itData.deductions_80d) - Number(itData.other_deductions))).toLocaleString()}</p>
                        <p className="text-lg font-semibold">Net Tax/Refund: ₹{(Number(itData.tds_credit) + Number(itData.advance_tax_paid) - calculateIncomeTax(Math.max(0, Number(itData.gross_income) - Number(itData.deductions_80c) - Number(itData.deductions_80d) - Number(itData.other_deductions)))).toLocaleString()}</p>
                      </div>
                      <Button onClick={saveITData} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accounting Category */}
            {workItem.category === "accounting" && (
              <Card>
                <CardHeader>
                  <CardTitle>Journal Entries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    <Input type="date" value={newEntry.entry_date} onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })} placeholder="Date" />
                    <Input value={newEntry.debit_account} onChange={(e) => setNewEntry({ ...newEntry, debit_account: e.target.value })} placeholder="Debit A/c" />
                    <Input value={newEntry.credit_account} onChange={(e) => setNewEntry({ ...newEntry, credit_account: e.target.value })} placeholder="Credit A/c" />
                    <Input type="number" value={newEntry.amount || ""} onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} placeholder="Amount" />
                    <Button onClick={addJournalEntry}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <Input value={newEntry.narration} onChange={(e) => setNewEntry({ ...newEntry, narration: e.target.value })} placeholder="Narration" />
                  
                  {entries.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Debit</TableHead>
                          <TableHead>Credit</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Narration</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                            <TableCell>{entry.debit_account}</TableCell>
                            <TableCell>{entry.credit_account}</TableCell>
                            <TableCell className="text-right">₹{Number(entry.amount).toLocaleString()}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.narration}</TableCell>
                            <TableCell><Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Compliance Category */}
            {workItem.category === "compliance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Task</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Task Type</Label>
                      <Select value={complianceData.task_type} onValueChange={(v) => setComplianceData({ ...complianceData, task_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mca_filing">MCA Filing</SelectItem>
                          <SelectItem value="board_resolution">Board Resolution</SelectItem>
                          <SelectItem value="annual_return">Annual Return</SelectItem>
                          <SelectItem value="roc_compliance">ROC Compliance</SelectItem>
                          <SelectItem value="statutory_register">Statutory Register</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Form Number</Label>
                      <Input value={complianceData.form_number} onChange={(e) => setComplianceData({ ...complianceData, form_number: e.target.value })} placeholder="e.g., MGT-7, AOC-4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={complianceData.due_date} onChange={(e) => setComplianceData({ ...complianceData, due_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>SRN (after filing)</Label>
                      <Input value={complianceData.srn} onChange={(e) => setComplianceData({ ...complianceData, srn: e.target.value })} placeholder="Filing reference" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea value={complianceData.remarks} onChange={(e) => setComplianceData({ ...complianceData, remarks: e.target.value })} placeholder="Additional notes..." />
                  </div>
                  <Button onClick={saveComplianceData} disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}</Button>
                </CardContent>
              </Card>
            )}

            {/* Audit Category */}
            {workItem.category === "audit" && (
              <Card>
                <CardHeader>
                  <CardTitle>Audit Findings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={newFinding.area} onChange={(e) => setNewFinding({ ...newFinding, area: e.target.value })} placeholder="Area (e.g., Cash Management)" />
                    <Select value={newFinding.risk_level} onValueChange={(v) => setNewFinding({ ...newFinding, risk_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea value={newFinding.description} onChange={(e) => setNewFinding({ ...newFinding, description: e.target.value })} placeholder="Finding description..." />
                  <Input value={newFinding.recommendation} onChange={(e) => setNewFinding({ ...newFinding, recommendation: e.target.value })} placeholder="Recommendation" />
                  <Button onClick={addFinding}><Plus className="w-4 h-4 mr-2" />Add Finding</Button>
                  
                  {findings.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      {findings.map((finding) => (
                        <div key={finding.id} className="p-4 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{finding.area}</span>
                            <Badge variant={finding.risk_level === "high" ? "destructive" : finding.risk_level === "medium" ? "default" : "secondary"}>
                              {finding.risk_level} risk
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          {finding.recommendation && <p className="text-sm"><span className="font-medium">Recommendation:</span> {finding.recommendation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generic for other categories */}
            {["fpa", "risk", "advisory"].includes(workItem.category) && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Add your analysis, notes, and findings here..." className="min-h-[200px]" />
                  <Button className="mt-4"><Save className="w-4 h-4 mr-2" />Save Notes</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
