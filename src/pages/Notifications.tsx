import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CheckCircle2, AlertTriangle, Info, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  timestamp: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "GSTR-3B Draft Ready",
    message: "GST Agent has prepared the GSTR-3B draft for December 2024. Please review and approve.",
    type: "info",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "ITC Mismatch Detected",
    message: "Found ₹45,230 mismatch between GSTR-2B and your purchase register. Action required.",
    type: "warning",
    timestamp: "4 hours ago",
    read: false,
  },
  {
    id: "3",
    title: "Advance Tax Reminder",
    message: "Q3 advance tax payment due on March 15, 2025. Estimated liability: ₹1,25,000",
    type: "warning",
    timestamp: "Yesterday",
    read: false,
  },
  {
    id: "4",
    title: "Bank Statement Processed",
    message: "HDFC statement for December has been processed. 156 transactions classified.",
    type: "success",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "5",
    title: "GSTR-1 Filed Successfully",
    message: "GSTR-1 for November 2024 has been filed successfully. ARN: AA123456789",
    type: "success",
    timestamp: "2 days ago",
    read: true,
  },
];

const typeConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  error: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  Notifications
                </h1>
                <p className="text-muted-foreground">
                  {unreadCount > 0 
                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  All Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const TypeIcon = typeConfig[notification.type].icon;
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border transition-all",
                          notification.read 
                            ? "bg-card border-border"
                            : "bg-secondary/30 border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          typeConfig[notification.type].bg
                        )}>
                          <TypeIcon className={cn("w-5 h-5", typeConfig[notification.type].color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "font-medium",
                              notification.read ? "text-muted-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
