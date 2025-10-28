
import { useState } from "react";
import { Bell, BellDot, Shield, Database, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors",
                    !notification.read && "bg-accent/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={cn(
                        "mt-0.5 rounded-full p-1",
                        getCategoryStyle(notification.category)
                      )}
                    >
                      {getCategoryIcon(notification.category)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={cn("text-sm", !notification.read && "font-medium")}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.action && (
                        <Link
                          to={notification.action.url}
                          className="text-sm text-primary hover:underline block mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {notification.action.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Link
            to="/settings/notifications"
            className="block w-full text-center text-sm text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'policy':
      return <Shield className="h-4 w-4 text-white" />;
    case 'system':
      return <Bell className="h-4 w-4 text-white" />;
    case 'integration':
      return <Database className="h-4 w-4 text-white" />;
    case 'user':
      return <Users className="h-4 w-4 text-white" />;
    default:
      return <Bell className="h-4 w-4 text-white" />;
  }
}

export function getCategoryStyle(category: string) {
  switch (category) {
    case 'policy':
      return 'bg-blue-500';
    case 'system':
      return 'bg-red-500';
    case 'integration':
      return 'bg-green-500';
    case 'user':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}

export function formatNotificationTime(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  
  return new Date(timestamp).toLocaleDateString();
}
