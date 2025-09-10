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
  Video,
  Settings, 
  LogOut,
  GraduationCap,
  UserCheck,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";

const getNavigationItems = (role: string | null) => {
  const baseItems = [
    { 
      name: "Dashboard", 
      href: "/", 
      icon: LayoutDashboard, 
      exact: true,
      roles: ["admin", "teacher", "student", "parent"],
      badge: undefined
    },
  ];

  const adminItems = [
    { 
      name: "Students", 
      href: "/students", 
      icon: Users,
      roles: ["admin", "teacher"]
    },
    { 
      name: "Teachers", 
      href: "/teachers", 
      icon: UserCheck,
      roles: ["admin"]
    },
  ];

  const examItems = [
    { 
      name: "Exams", 
      href: "/exams", 
      icon: FileText,
      roles: ["admin", "teacher", "student", "parent"]
    },
  ];

  const progressItems = [
    { 
      name: "Progress", 
      href: "/progress", 
      icon: TrendingUp,
      roles: ["admin", "teacher", "student", "parent"]
    },
    { 
      name: "Attendance", 
      href: "/attendance", 
      icon: ClipboardList,
      roles: ["admin", "teacher", "student", "parent"]
    },
  ];

  const paymentItems = [
    { 
      name: "Payments", 
      href: "/payments", 
      icon: CreditCard,
      roles: ["admin", "student", "parent"]
    },
  ];

  const communicationItems = [
    {
      name: "Video Conferencing",
      href: "/video-conferencing",
      icon: Video,
      roles: ["admin", "teacher", "student", "parent"],
    },
    {
      name: "Communications",
      href: "/communications",
      icon: MessageSquare,
      roles: ["admin", "teacher", "student", "parent"],
      exact: false
    },
    {
      name: "Resources",
      href: "/resources",
      icon: BookOpen,
      roles: ["admin", "teacher", "student", "parent"]
    },
  ];

  const allItems = [...baseItems, ...adminItems, ...examItems, ...progressItems, ...paymentItems, ...communicationItems].map(item => ({
    ...item,
    exact: item.exact || false,
    badge: item.badge || undefined
  }));
  
  return allItems.filter(item => role && item.roles.includes(role));
};

const getSettingsItems = (role: string | null) => {
  return [
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings,
      roles: ["admin", "teacher", "student", "parent"]
    },
  ].filter(item => role && item.roles.includes(role));
};

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function Sidebar({ className, isCollapsed, setIsCollapsed }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { role } = useRole();
  const { logout } = useAuth();
  
  const navigationItems = getNavigationItems(role);
  const settingsItems = getSettingsItems(role);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/landing');
  };

  return (
    <aside className={cn("bg-card shadow-lg border-r border-border flex flex-col h-full transition-all duration-300", {
      "w-64": !isCollapsed,
      "w-20": isCollapsed,
    }, className)}>
      <div className="p-4 flex items-center justify-between">
        <div className={cn("flex items-center space-x-3", { "hidden": isCollapsed })}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="text-primary-foreground text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">EduManage</h1>
            <p className="text-sm text-muted-foreground">School Portal</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="mx-auto">
          {isCollapsed ? ">>" : "<<"}
        </Button>
      </div>
      
      <nav className="px-2 pb-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                { "justify-center": isCollapsed },
                isActive(item.href, item.exact)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid={`link-${item.name.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className={cn("font-medium", { "hidden": isCollapsed })}>{item.name}</span>
              {item.badge && !isCollapsed && (
                <Badge variant="secondary" className="ml-auto bg-accent text-accent-foreground">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      </nav>
      <div className="p-2 mt-auto border-t border-border">
        {settingsItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              { "justify-center": isCollapsed },
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid={`link-${item.name.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5" />
            <span className={cn("font-medium", { "hidden": isCollapsed })}>{item.name}</span>
          </Link>
        ))}

        <Button
          variant="ghost"
          className={cn("w-full justify-start px-4 py-3 text-muted-foreground hover:text-foreground", {
            "justify-center px-0": isCollapsed,
          })}
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className={cn("font-medium ml-3", { "hidden": isCollapsed })}>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
