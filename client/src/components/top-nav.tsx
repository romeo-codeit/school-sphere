import { Search, Bell, Menu, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface TopNavProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  isLoading?: boolean;
}

export function TopNav({ title, subtitle, onToggleSidebar, isLoading }: TopNavProps) {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="lg:hidden p-2"
            onClick={onToggleSidebar}
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {isLoading && <RefreshCw className="w-6 h-6 animate-spin text-primary" />}
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
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
              src={"https://placehold.co/100x100"}
              alt="User profile" 
              className="w-10 h-10 rounded-full object-cover"
              data-testid="img-user-avatar"
            />
            <div className="hidden md:block">
              <p className="font-medium text-foreground" data-testid="text-user-name">
                {user?.name || ""}
              </p>
              <p className="text-sm text-muted-foreground capitalize" data-testid="text-user-role">
                {user?.prefs?.role || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}