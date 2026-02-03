import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Building2, Search, Edit, Trash2 } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  contact_person: string | null;
  contact_email: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    company_name: "",
    gstin: "",
    pan: "",
    cin: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    address: ""
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load clients");
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(formData)
        .eq("id", editingClient.id);
      
      if (error) {
        toast.error("Failed to update client");
      } else {
        toast.success("Client updated!");
        fetchClients();
      }
    } else {
      const { error } = await supabase
        .from("clients")
        .insert({ ...formData, user_id: user.id });
      
      if (error) {
        toast.error("Failed to add client");
      } else {
        toast.success("Client added!");
        fetchClients();
      }
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client? All related work will be deleted.")) return;
    
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete client");
    } else {
      toast.success("Client deleted");
      fetchClients();
    }
  };

  const resetForm = () => {
    setFormData({ company_name: "", gstin: "", pan: "", cin: "", contact_person: "", contact_email: "", contact_phone: "", address: "" });
    setEditingClient(null);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name,
      gstin: client.gstin || "",
      pan: client.pan || "",
      cin: client.cin || "",
      contact_person: client.contact_person || "",
      contact_email: client.contact_email || "",
      contact_phone: "",
      address: ""
    });
    setDialogOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase()) ||
    c.pan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Clients</h1>
                <p className="text-muted-foreground">Manage your client companies</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Add Client</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>GSTIN</Label>
                        <Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                      </div>
                      <div className="space-y-2">
                        <Label>PAN</Label>
                        <Input value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} placeholder="AAAAA0000A" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>CIN</Label>
                      <Input value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} placeholder="U12345MH2000PTC123456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Person</Label>
                        <Input value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">{editingClient ? "Update Client" : "Add Client"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search clients by name, GSTIN, or PAN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No clients found. Add your first client to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/work?client=${client.id}`)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{client.company_name}</CardTitle>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(client)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {client.gstin && <p><span className="text-muted-foreground">GSTIN:</span> {client.gstin}</p>}
                      {client.pan && <p><span className="text-muted-foreground">PAN:</span> {client.pan}</p>}
                      {client.contact_person && <p><span className="text-muted-foreground">Contact:</span> {client.contact_person}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
