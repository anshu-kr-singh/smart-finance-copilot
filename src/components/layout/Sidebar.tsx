import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
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
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const remaining = getRemainingWorkItems();
  const isPro = subscription?.plan !== "free";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const NavLink = ({ item, index }: { item: NavItem; index: number }) => {
    const isActive = activeItem === item.href;
    const isHovered = hoveredItem === item.href;
    const Icon = item.icon;

    return (
      <button
        onClick={() => onNavigate?.(item.href)}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
          isActive
            ? "text-primary-foreground shadow-lg"
            : "text-muted-foreground hover:text-foreground"
        )}
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? "translateX(0) scale(1)"
            : "translateX(-30px) scale(0.9)",
          transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 60}ms`,
        }}
      >
        {/* Active background with gradient */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-lg gradient-primary"
            style={{
              animation: "navGlow 2s ease-in-out infinite alternate",
            }}
          />
        )}

        {/* Hover ripple effect */}
        {!isActive && isHovered && (
          <div
            className="absolute inset-0 rounded-lg bg-secondary"
            style={{
              animation: "navRipple 0.4s ease-out forwards",
            }}
          />
        )}

        <div
          className="relative z-10 flex items-center gap-3 w-full"
          style={{
            transform: isHovered && !isActive ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div
            className={cn(
              "relative flex-shrink-0 transition-transform duration-300",
              isHovered && !isActive && "scale-110"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 transition-all duration-300",
                isActive && "text-primary-foreground",
                isHovered && !isActive && "text-primary"
              )}
            />
            {isActive && (
              <div
                className="absolute -inset-1 rounded-full bg-primary-foreground/20 blur-sm"
                style={{ animation: "iconPulse 2s ease-in-out infinite" }}
              />
            )}
          </div>

          {!collapsed && (
            <>
              <span className={cn(
                "font-medium text-sm transition-all duration-300",
                isActive && "text-primary-foreground font-semibold"
              )}>
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "ml-auto px-2 py-0.5 text-xs font-semibold rounded-full transition-all duration-300",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                  style={{
                    transform: isHovered ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>

        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            style={{ animation: "badgeBounce 0.5s ease-out" }}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col shadow-card relative",
        collapsed ? "w-[72px]" : "w-64"
      )}
      style={{
        transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(-15px) scale(0.9)",
            transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <img
            src={apnaCaLogo}
            alt="Apna CA"
            className={cn(
              "object-contain rounded-lg shadow-lg transition-all duration-500",
              collapsed ? "w-10 h-10" : "w-12 h-12"
            )}
            style={{
              animation: mounted ? "logoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          />
          {!collapsed && (
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateX(0)" : "translateX(-10px)",
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s",
              }}
            >
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
        {navItems.map((item, i) => (
          <NavLink key={item.href} item={item} index={i} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item, i) => (
          <NavLink key={item.href} item={item} index={navItems.length + i} />
        ))}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary hover:scale-110 active:scale-95 transition-all duration-300"
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
