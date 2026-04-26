"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  const markAsRead = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
        setUnreadCount(prev => Math.max(0, prev - ids.length));
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // 30秒ごとにポーリング
    const interval = setInterval(fetchNotifications, 30000);

    // ページにフォーカスが戻ったときも再取得
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const handleNotificationClick = async (n: Notification) => {
    await markAsRead([n.id]);
    if (n.link) {
      router.push(n.link);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    handleNotificationClick,
    refresh: fetchNotifications
  };
}
