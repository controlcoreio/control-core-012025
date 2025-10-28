
import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export type NotificationAction = {
  label: string;
  url: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  category: 'policy' | 'system' | 'integration' | 'user';
  timestamp: number;
  read: boolean;
  action?: NotificationAction;
};

type NotificationsContextType = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
});

export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Policy Updated",
    message: "The 'Admin Access' policy was updated by Jane Smith",
    category: "policy",
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    read: false,
    action: {
      label: "View Policy",
      url: "/policies",
    },
  },
  {
    id: "2",
    title: "Integration Disconnected",
    message: "The connection to the LDAP server was lost",
    category: "integration",
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    read: false,
    action: {
      label: "Check Integration",
      url: "/settings/integrations",
    },
  },
  {
    id: "3",
    title: "New User Added",
    message: "Alex Johnson was added to the system",
    category: "user",
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    read: true,
    action: {
      label: "View User",
      url: "/settings/users",
    },
  },
  {
    id: "4",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur on Sunday at 2AM",
    category: "system",
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    read: true,
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // If we have browser notifications enabled and permission, show one
    if (window.Notification && Notification.permission === 'granted') {
      // We'd check user preferences here in a real app
      new Notification(notification.title, {
        body: notification.message,
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
