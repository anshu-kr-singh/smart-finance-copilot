import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Calculator, 
  Shield, 
  Loader2, 
  Receipt, 
  ClipboardCheck, 
  Building2, 
  LineChart,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Bot
} from "lucide-react";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

const features = [
  { icon: Receipt, title: "GST Agent", description: "GSTR-1, 2B matching & ITC reconciliation" },
  { icon: Calculator, title: "Income Tax Agent", description: "AIS reconciliation & ITR drafts" },
  { icon: ClipboardCheck, title: "Audit Assistant", description: "Risk sampling & evidence management" },
  { icon: Building2, title: "ROC Compliance", description: "Deadline tracking & form drafting" },
  { icon: BookOpen, title: "Accounting Agent", description: "Auto classification & reconciliation" },
  { icon: LineChart, title: "FP&A Advisory", description: "Budget analysis & forecasting" },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [flipKey, setFlipKey] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward">("forward");
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPageReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleTabChange = (value: string) => {
    const nextTab = value as "login" | "signup";
    setFlipDirection(nextTab === "signup" ? "forward" : "backward");
    setActiveTab(nextTab);
    setFlipKey((current) => current + 1);
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const logLoginActivity = async (userId: string) => {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "login",
      entity_type: "auth",
      details: { method: "email" }
    });
  };

  const isNetworkAuthError = (message?: string) =>
    Boolean(message?.toLowerCase().includes("failed to fetch"));

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runAuthWithRetry = async <T,>(
    operation: () => Promise<{ data: T; error: { message?: string } | null }>,
    retries = 2
  ) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await operation();

      if (!result.error) return result;

      if (!isNetworkAuthError(result.error.message) || attempt === retries) {
        return result;
      }

      await wait(400 * (attempt + 1));
    }

    return operation();
  };

  const formatAuthError = (message?: string) => {
    if (!message) return "Something went wrong. Please try again.";

    const normalized = message.toLowerCase();

    if (normalized.includes("failed to fetch")) {
      return "Unable to reach authentication server. Please disable VPN/ad blocker or switch network and try again.";
    }

    if (normalized.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }

    return message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please connect to the internet and try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await runAuthWithRetry(() =>
        supabase.auth.signInWithPassword({ email, password })
      );

      if (error) {
        toast.error(formatAuthError(error.message));
        return;
      }

      if (data.user) {
        await logLoginActivity(data.user.id);
      }

      toast.success("Welcome back!");
      sessionStorage.setItem("show_splash_after_auth", "1");
      navigate("/");
    } catch (error) {
      toast.error(formatAuthError(error instanceof Error ? error.message : undefined));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("You are offline. Please connect to the internet and try again.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await runAuthWithRetry(() =>
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName }
          }
        })
      );

      if (error) {
        toast.error(formatAuthError(error.message));
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        sessionStorage.removeItem("splash_shown");
        navigate("/");
      } else {
        toast.success("Check your email to verify your account!");
      }
    } catch (error) {
      toast.error(formatAuthError(error instanceof Error ? error.message : undefined));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between relative overflow-hidden" style={{ animation: 'fadeIn 0.8s ease-out' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <img 
              src={apnaCaLogo} 
              alt="Apna CA Logo" 
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Apna CA</h1>
              <p className="text-sm text-white/70">Your Smart CA Assistant</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mb-12">
            <h2 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
              Professional CA Practice, Powered by AI
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Real industry work with intelligent agents. Upload data, process GST returns, reconcile accounts, and generate professional outputs.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-white/60">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur">
            <Sparkles className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-white">Start Free</p>
              <p className="text-sm text-white/70">First 5 work items are completely free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center justify-center gap-3 mb-8 lg:hidden">
            <img 
              src={apnaCaLogo} 
              alt="Apna CA Logo" 
              className="w-24 h-24 object-contain"
            />
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold text-foreground">Apna CA</h1>
              <p className="text-sm text-muted-foreground">Your Smart CA Assistant</p>
            </div>
          </div>

          <Card className="shadow-xl border-border/50" style={{ animation: pageReady ? 'cardEntrance 0.6s ease-out forwards' : 'none', opacity: pageReady ? 1 : 0 }}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display">Welcome</CardTitle>
              <CardDescription>Sign in to manage your CA practice</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="transition-all duration-200">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="transition-all duration-200">Sign Up</TabsTrigger>
                </TabsList>

                <div className="overflow-hidden rounded-xl" style={{ perspective: "1600px" }}>
                  <div
                    key={flipKey}
                    className="origin-center rounded-xl"
                    style={{
                      animation: flipDirection === "forward" ? "pageFlipForward 0.7s cubic-bezier(0.22, 1, 0.36, 1)" : "pageFlipBackward 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {activeTab === "login" ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="ca@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="CA Rajesh Kumar"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="ca@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Create Free Account"
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Get 5 free work items • No credit card required
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              <span>For CAs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
