import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [settings, setSettings] = useState({
    name: "Rahul Sharma",
    email: "rahul@example.com",
    firm: "Sharma & Associates",
    gstin: "27AABCU9603R1ZM",
    emailNotifications: true,
    pushNotifications: true,
    deadlineReminders: true,
    agentAlerts: true,
    autoApproval: false,
    darkMode: true,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account, notifications, and preferences
              </p>
            </div>

            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </CardTitle>
                <CardDescription>Your personal and business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm">Firm Name</Label>
                    <Input 
                      id="firm" 
                      value={settings.firm}
                      onChange={(e) => setSettings({ ...settings, firm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN</Label>
                    <Input 
                      id="gstin" 
                      value={settings.gstin}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure how you receive alerts and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Deadline Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded before compliance deadlines</p>
                  </div>
                  <Switch 
                    checked={settings.deadlineReminders}
                    onCheckedChange={(checked) => setSettings({ ...settings, deadlineReminders: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Agent Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications when agents complete tasks</p>
                  </div>
                  <Switch 
                    checked={settings.agentAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, agentAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Governance
                </CardTitle>
                <CardDescription>Control agent permissions and approval workflows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-Approval for Low Risk</p>
                    <p className="text-sm text-muted-foreground">Allow agents to auto-file low-risk returns</p>
                  </div>
                  <Switch 
                    checked={settings.autoApproval}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoApproval: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Extra security for your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
              </CardContent>
            </Card>

            {/* Data & Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data & Storage
                </CardTitle>
                <CardDescription>Manage your data and connected services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Storage Used</p>
                    <p className="text-sm text-muted-foreground">2.4 GB of 10 GB</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Export Data</p>
                    <p className="text-sm text-muted-foreground">Download all your data</p>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
