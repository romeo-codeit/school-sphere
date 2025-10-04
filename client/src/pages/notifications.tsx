import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Search, Clock, Trash2, CheckCheck, Mail, MailOpen } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { TopNav } from "@/components/top-nav";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [filterType, setFilterType] = useState<string>("All");

  const filterTypes = ["All", "Unread", "Read"];

  // Filter notifications by search and read status
  const filtered = (localNotifications || []).filter((n: any) => {
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = 
      filterType === "All" ? true :
      filterType === "Unread" ? !n.isRead :
      filterType === "Read" ? n.isRead : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TopNav title="Notifications" subtitle="Stay informed with your school alerts" showGoBackButton />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Action Buttons and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
                {unreadCount} unread
              </Badge>
            ) : (
              <p className="text-muted-foreground">All caught up!</p>
            )}
          </div>
            
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={async (e) => {
                e.preventDefault();
                await markAllAsRead();
              }}
              variant="outline"
              size="sm"
              className="h-10"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
            <Button 
              onClick={deleteAll}
              variant="outline"
              size="sm"
              className="h-10 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filterTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-card hover:bg-accent text-muted-foreground hover:text-foreground border"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-destructive/10 rounded-full mb-4">
                  <BellOff className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Notifications</h3>
                <p className="text-muted-foreground">Unable to fetch notifications. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Bell className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Notifications Found</h3>
                <p className="text-muted-foreground">
                  {search || filterType !== "All" 
                    ? "Try adjusting your filters" 
                    : "You're all caught up! No notifications yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => {
              const NotificationIcon = n.isRead ? MailOpen : Mail;
              return (
                <Card 
                  key={n.$id} 
                  className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-l-4 ${
                    n.isRead ? 'border-l-gray-300 opacity-75' : 'border-l-primary'
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${
                        n.isRead ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        <NotificationIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          n.isRead ? 'text-muted-foreground' : 'text-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <p className={`font-medium text-sm sm:text-base leading-relaxed break-words ${
                            n.isRead ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {n.message}
                          </p>
                          {!n.isRead && (
                            <Badge className="bg-primary text-primary-foreground shrink-0 self-start">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {formatDistanceToNow(new Date(n.$createdAt))} ago
                          </div>
                          {!n.isRead && (
                            <Button
                              onClick={() => markAsRead(n.$id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs sm:text-sm text-primary hover:text-primary self-start"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
