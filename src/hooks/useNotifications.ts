import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      const typedData = (data || []).map(n => ({
        ...n,
        type: n.type as "info" | "success" | "warning" | "error"
      }));
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.read).length);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNotification = {
                ...payload.new,
                type: (payload.new as any).type as "info" | "success" | "warning" | "error"
              } as Notification;
              setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
              setUnreadCount(prev => prev + 1);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => 
                n.id === (payload.new as any).id 
                  ? { ...payload.new, type: (payload.new as any).type as "info" | "success" | "warning" | "error" } as Notification
                  : n
              ));
              // Recalculate unread count
              fetchNotifications();
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
              fetchNotifications();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchNotifications]);

  const createNotification = async (
    title: string,
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
    entityType?: string,
    entityId?: string
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        title,
        message,
        type,
        entity_type: entityType || null,
        entity_id: entityId || null
      });

    if (error) {
      console.error("Error creating notification:", error);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user?.id)
      .eq("read", false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  return { 
    notifications, 
    loading, 
    unreadCount,
    createNotification,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refetch: fetchNotifications 
  };
}
