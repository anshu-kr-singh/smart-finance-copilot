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
  Bot,
  ArrowRight,
} from "lucide-react";
import apnaCaLogo from "@/assets/apna-ca-logo.png";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { AuthForm } from "@/components/auth/AuthForm";

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
      if (!isNetworkAuthError(result.error.message) || attempt === retries) return result;
      await wait(400 * (attempt + 1));
    }
    return operation();
  };

  const formatAuthError = (message?: string) => {
    if (!message) return "Something went wrong. Please try again.";
    const normalized = message.toLowerCase();
    if (normalized.includes("failed to fetch"))
      return "Unable to reach authentication server. Please disable VPN/ad blocker or switch network and try again.";
    if (normalized.includes("invalid login credentials"))
      return "Invalid email or password.";
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
      if (error) { toast.error(formatAuthError(error.message)); return; }
      if (data.user) await logLoginActivity(data.user.id);
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
      if (error) { toast.error(formatAuthError(error.message)); return; }
      if (data.session) {
        toast.success("Account created successfully!");
        sessionStorage.setItem("show_splash_after_auth", "1");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div style={{ animation: "authSpinPulse 1.5s ease-in-out infinite" }}>
          <Loader2 className="w-10 h-10 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Panel */}
      <AuthLeftPanel pageReady={pageReady} />

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 bg-background flex items-center justify-center p-8 relative">
        {/* Floating orbs background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
            style={{ animation: "authOrb1 8s ease-in-out infinite" }} />
          <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/5 blur-3xl"
            style={{ animation: "authOrb2 10s ease-in-out infinite" }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center justify-center gap-3 mb-8 lg:hidden"
            style={{
              opacity: pageReady ? 1 : 0,
              transform: pageReady ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.9)",
              transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <img
              src={apnaCaLogo}
              alt="Apna CA Logo"
              className="w-24 h-24 object-contain"
              style={{ animation: pageReady ? "auth3DLogo 1s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none" }}
            />
            <div className="text-center">
              <h1 className="text-2xl font-display font-bold text-foreground">Apna CA</h1>
              <p className="text-sm text-muted-foreground">Your Smart CA Assistant</p>
            </div>
          </div>

          <Card
            className="shadow-xl border-border/50 backdrop-blur-sm bg-card/95 overflow-hidden"
            style={{
              opacity: pageReady ? 1 : 0,
              transform: pageReady
                ? "perspective(1200px) rotateX(0deg) translateY(0)"
                : "perspective(1200px) rotateX(-8deg) translateY(40px)",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
            }}
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full gradient-primary" style={{
              animation: pageReady ? "authBarSlide 0.8s ease-out 0.5s both" : "none",
            }} />

            <CardHeader className="text-center pb-2">
              <CardTitle
                className="text-2xl font-display"
                style={{
                  opacity: pageReady ? 1 : 0,
                  transform: pageReady ? "translateY(0)" : "translateY(10px)",
                  transition: "all 0.5s ease-out 0.4s",
                }}
              >
                Welcome
              </CardTitle>
              <CardDescription
                style={{
                  opacity: pageReady ? 1 : 0,
                  transform: pageReady ? "translateY(0)" : "translateY(10px)",
                  transition: "all 0.5s ease-out 0.5s",
                }}
              >
                Sign in to manage your CA practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 relative overflow-hidden">
                  <TabsTrigger value="login" className="transition-all duration-300 z-10">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="transition-all duration-300 z-10">Sign Up</TabsTrigger>
                </TabsList>

                <div className="overflow-hidden rounded-xl" style={{ perspective: "1600px" }}>
                  <div
                    key={flipKey}
                    className="origin-center rounded-xl"
                    style={{
                      animation:
                        flipDirection === "forward"
                          ? "pageFlipForward 0.7s cubic-bezier(0.22, 1, 0.36, 1)"
                          : "pageFlipBackward 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <AuthForm
                      activeTab={activeTab}
                      email={email}
                      password={password}
                      fullName={fullName}
                      loading={loading}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onFullNameChange={setFullName}
                      onLogin={handleLogin}
                      onSignup={handleSignup}
                    />
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div
            className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            style={{
              opacity: pageReady ? 1 : 0,
              transform: pageReady ? "translateY(0)" : "translateY(15px)",
              transition: "all 0.6s ease-out 0.7s",
            }}
          >
            <div className="flex items-center gap-1.5 transition-all duration-300 hover:text-primary hover:scale-105 cursor-default">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 transition-all duration-300 hover:text-primary hover:scale-105 cursor-default">
              <CheckCircle2 className="w-4 h-4" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 transition-all duration-300 hover:text-primary hover:scale-105 cursor-default">
              <Calculator className="w-4 h-4" />
              <span>For CAs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
