import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  TrendingUp, 
  CreditCard, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  LogOut,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard, 
    exact: true 
  },
  { 
    name: "Students", 
    href: "/students", 
    icon: Users 
  },
  { 
    name: "Exams", 
    href: "/exams", 
    icon: FileText 
  },
  { 
    name: "Progress", 
    href: "/progress", 
    icon: TrendingUp 
  },
  { 
    name: "Payments", 
    href: "/payments", 
    icon: CreditCard 
  },
  { 
    name: "Messages", 
    href: "/messages", 
    icon: MessageSquare,
    badge: 3 
  },
  { 
    name: "Resources", 
    href: "/resources", 
    icon: BookOpen 
  },
];

const settingsItems = [
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings 
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <aside className={cn("w-64 bg-card shadow-lg border-r border-border", className)}>
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="text-primary-foreground text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">EduManage</h1>
            <p className="text-sm text-muted-foreground">School Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive(item.href, item.exact)
                  ? "bg-primary/10 text-primary border-l-3 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid={`link-${item.name.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto bg-accent text-accent-foreground">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
          
          <div className="pt-4 border-t border-border">
            {settingsItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
