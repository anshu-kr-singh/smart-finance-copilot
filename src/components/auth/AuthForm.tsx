import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";

interface AuthFormProps {
  activeTab: "login" | "signup";
  email: string;
  password: string;
  fullName: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onFullNameChange: (v: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onSignup: (e: React.FormEvent) => void;
}

export function AuthForm({
  activeTab, email, password, fullName, loading,
  onEmailChange, onPasswordChange, onFullNameChange,
  onLogin, onSignup,
}: AuthFormProps) {
  if (activeTab === "login") {
    return (
      <form onSubmit={onLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="ca@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className="transition-all duration-300 focus:shadow-md focus:scale-[1.01]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            className="transition-all duration-300 focus:shadow-md focus:scale-[1.01]"
          />
        </div>
        <Button type="submit" className="w-full group" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="CA Rajesh Kumar"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          required
          className="transition-all duration-300 focus:shadow-md focus:scale-[1.01]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="ca@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className="transition-all duration-300 focus:shadow-md focus:scale-[1.01]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          minLength={6}
          className="transition-all duration-300 focus:shadow-md focus:scale-[1.01]"
        />
      </div>
      <Button type="submit" className="w-full group" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Create Free Account
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Get 5 free work items • No credit card required
      </p>
    </form>
  );
}
