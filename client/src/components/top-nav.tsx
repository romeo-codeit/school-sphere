import { Search, Bell, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface TopNavProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export function TopNav({ title, subtitle, onToggleSidebar }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="lg:hidden p-2"
            onClick={onToggleSidebar}
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search students, exams..."
              className="w-64 pl-10 bg-muted border-border"
              data-testid="input-search"
            />
          </div>
          
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                5
              </Badge>
            </Button>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"}
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover"
              data-testid="img-user-avatar"
            />
            <div className="hidden md:block">
              <p className="font-medium text-foreground" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || "User"}
              </p>
              <p className="text-sm text-muted-foreground capitalize" data-testid="text-user-role">
                {user?.role || "User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
