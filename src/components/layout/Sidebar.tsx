import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import {
  LayoutDashboard,
  Bot,
  Upload,
  MessageSquare,
  FileCheck,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Building2,
  Briefcase,
  Crown,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Building2, label: "Clients", href: "/clients" },
  { icon: Briefcase, label: "Work", href: "/work" },
  { icon: Bot, label: "AI Agents", href: "/agents" },
  { icon: Upload, label: "Upload Data", href: "/upload" },
  { icon: MessageSquare, label: "Ask Query", href: "/query" },
  { icon: FileCheck, label: "Approvals", href: "/approvals", badge: 3 },
  { icon: TrendingUp, label: "Reports", href: "/reports" },
  { icon: Shield, label: "Compliance", href: "/compliance" },
];

const bottomItems: NavItem[] = [
  { icon: Bell, label: "Notifications", href: "/notifications", badge: 5 },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export function Sidebar({ activeItem = "/", onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { subscription, getRemainingWorkItems } = useSubscription();
  
  const remaining = getRemainingWorkItems();
  const isPro = subscription?.plan !== "free";

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = activeItem === item.href;
    const Icon = item.icon;

    return (
      <button
        onClick={() => onNavigate?.(item.href)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
        {!collapsed && (
          <>
            <span className="font-medium text-sm">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto px-2 py-0.5 text-xs font-semibold rounded-full",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary/10 text-primary"
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 shadow-card",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={apnaCaLogo} 
            alt="Apna CA" 
            className={cn(
              "object-contain rounded-lg shadow-lg",
              collapsed ? "w-10 h-10" : "w-12 h-12"
            )}
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-foreground">Apna CA</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground">Smart CA Assistant</span>
                {isPro ? (
                  <Badge className="gradient-primary text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                    <Crown className="w-2.5 h-2.5 mr-0.5" />
                    PRO
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    {typeof remaining === "number" ? `${remaining} free` : "Free"}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
