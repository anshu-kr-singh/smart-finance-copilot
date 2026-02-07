import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { User, Bell, Shield, Database, Save, Loader2, Crown, CreditCard, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { logActivity } = useActivityLog();
  const { subscription, getRemainingWorkItems, getUsagePercentage, isPaidPlan } = useSubscription();
  
  const [saving, setSaving] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    firm_name: "",
    membership_number: "",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    deadlineReminders: true,
    agentAlerts: true,
  });

  const [security, setSecurity] = useState({
    autoApproval: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        firm_name: profile.firm_name || "",
        membership_number: profile.membership_number || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await updateProfile(formData);
    
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully!");
      await logActivity("update", "profile", profile?.id, { name: formData.full_name });
    }
    
    setSaving(false);
  };

  if (profileLoading) {
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

            {/* Subscription Settings */}
            <Card className={subscription?.plan !== "free" ? "border-primary/30" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Subscription
                  {subscription && (
                    <Badge className={subscription.plan === "free" ? "bg-secondary text-secondary-foreground" : "gradient-primary text-white"}>
                      {PLANS[subscription.plan].name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Manage your plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscription?.plan === "free" ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Work Items Used</span>
                        <span className="font-medium">{subscription.work_items_used} / {subscription.work_items_limit}</span>
                      </div>
                      <Progress value={getUsagePercentage()} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {typeof getRemainingWorkItems() === "number" 
                          ? `${getRemainingWorkItems()} free work items remaining`
                          : "Unlimited work items"}
                      </p>
                    </div>
                    <Separator />
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Upgrade to Professional</p>
                          <p className="text-sm text-muted-foreground mb-3">
                            Unlock unlimited work items and premium features for ₹999/month
                          </p>
                          <ul className="grid grid-cols-2 gap-1 mb-3">
                            {PLANS.professional.features.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-center gap-1 text-xs">
                                <Check className="w-3 h-3 text-success" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Button size="sm" onClick={() => setUpgradeModalOpen(true)}>
                            <Crown className="w-4 h-4 mr-1" />
                            Upgrade Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Current Plan</p>
                        <p className="text-sm text-muted-foreground">{PLANS[subscription.plan].name} - {PLANS[subscription.plan].priceDisplay}</p>
                      </div>
                      <Badge className="gradient-primary text-white">Active</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Work Items</p>
                        <p className="text-sm text-muted-foreground">Unlimited access</p>
                      </div>
                      <span className="text-2xl font-bold text-success">∞</span>
                    </div>
                    {subscription.current_period_end && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">Next Billing Date</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(subscription.current_period_end).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">Manage Billing</Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

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
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm">Firm Name</Label>
                    <Input 
                      id="firm" 
                      value={formData.firm_name}
                      onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                      placeholder="Your CA firm name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="membership">Membership Number</Label>
                    <Input 
                      id="membership" 
                      value={formData.membership_number}
                      onChange={(e) => setFormData({ ...formData, membership_number: e.target.value })}
                      placeholder="ICAI membership number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
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
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Deadline Reminders</p>
                    <p className="text-sm text-muted-foreground">Get reminded before compliance deadlines</p>
                  </div>
                  <Switch 
                    checked={notifications.deadlineReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, deadlineReminders: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Agent Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications when agents complete tasks</p>
                  </div>
                  <Switch 
                    checked={notifications.agentAlerts}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, agentAlerts: checked })}
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
                    <p className="text-sm text-muted-foreground">Allow agents to auto-file low-risk returns (requires CA review)</p>
                  </div>
                  <Switch 
                    checked={security.autoApproval}
                    onCheckedChange={(checked) => setSecurity({ ...security, autoApproval: checked })}
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
                    <p className="font-medium text-foreground">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString("en-IN", { 
                            day: "numeric", 
                            month: "long", 
                            year: "numeric" 
                          })
                        : "Unknown"}
                    </p>
                  </div>
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
              <Button onClick={handleSave} className="gap-2" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen}
        currentPlan={subscription?.plan || "free"}
      />
    </div>
  );
}
