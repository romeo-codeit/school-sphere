import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { notifications, isLoading, error, markAsRead, markAllAsRead } = useNotifications();
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  useEffect(() => {
    if (notifications) setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter(n => !n.isRead).length;

  const deleteAll = () => {
    setLocalNotifications([]);
  };

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Removed duplicate declaration of markAllAsRead

  // Filter notifications by search and date range
  const filtered = (localNotifications || []).filter((n: any) => {
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase());
    const notifDate = new Date(n.$createdAt);
    const matchesStart = startDate ? notifDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? notifDate <= new Date(endDate) : true;
    return matchesSearch && matchesStart && matchesEnd;
  });

  return (
  <div className="min-h-screen bg-background">
      <TopNav title="All Notifications" subtitle="Your school alerts and updates" showGoBackButton />
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> All Notifications
          </h2>
          <div className="flex gap-2">
            <button
              className="bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20 text-sm font-medium"
              onClick={async (e) => {
                e.preventDefault();
                await markAllAsRead();
              }}
            >
              Mark all as read
            </button>
            <button className="bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20 text-sm font-medium" onClick={deleteAll}>Delete all</button>
          </div>
        </div>
  <div className="mb-4 text-sm text-primary font-semibold">Unread: {unreadCount}</div>
        <div className="flex flex-col md:flex-row gap-2 mb-6">
          <Input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="md:w-1/3"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-primary" /> From
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-32" />
            </label>
            <label className="flex items-center gap-1 text-sm">
              <Calendar className="w-4 h-4 text-primary" /> To
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-32" />
            </label>
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mb-2 animate-pulse text-primary" />
            <span>Loading notifications...</span>
          </div>
        ) : error ? (
          <p className="text-destructive">Error loading notifications</p>
        ) : (
          <ul className="space-y-4">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Calendar className="w-10 h-10 mb-2 text-primary" />
                <span>No notifications found</span>
              </div>
            )}
            {filtered.map(n => (
              <li key={n.$id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-lg shadow-sm hover:bg-muted/50 border-l-4 border-primary">
                <div>
                  <p className="font-semibold">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.$createdAt))} ago</p>
                </div>
                {!n.isRead && (
                  <button className="text-primary underline ml-2" onClick={() => markAsRead(n.$id)}>Mark as read</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
