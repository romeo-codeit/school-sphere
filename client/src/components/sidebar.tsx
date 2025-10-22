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
  UserCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

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
      roles: ["admin", "teacher"],
      exact: false,
      badge: undefined
    },
    { 
      name: "Teachers", 
      href: "/teachers", 
      icon: UserCheck,
      roles: ["admin"],
      exact: false,
      badge: undefined
    },
    {
      name: "Subjects",
      href: "/subjects",
      icon: BookOpen,
      roles: ["admin"],
      exact: false,
      badge: undefined
    },
  ];

  const attendanceItems = [
    {
      name: "Attendance",
      href: "/attendance",
      icon: ClipboardList,
      roles: ["admin", "teacher"],
      exact: false,
      badge: undefined
    }
  ];

  const examItems = [
    { 
      name: "Exams", 
      href: "/exams", 
      icon: FileText,
      roles: ["admin", "teacher", "student", "parent", "guest"],
      exact: false,
      badge: undefined
    },
  ];

  const progressItems = [
    { 
      name: "Progress", 
      href: "/progress", 
      icon: TrendingUp,
      roles: ["admin", "teacher", "student", "parent"],
      exact: false,
      badge: undefined
    }
  ];

  const paymentItems = [
    { 
      name: "Payments", 
      href: "/payments", 
      icon: CreditCard,
      roles: ["admin", "student", "parent"],
      exact: false,
      badge: undefined
    },
  ];

  const communicationItems = [
    {
      name: "Video Conferencing",
      href: "/video-conferencing",
      icon: Video,
      roles: ["admin", "teacher", "student", "parent"],
      exact: false,
      badge: undefined
    },
    {
      name: "Communications",
      href: "/communications",
      icon: MessageSquare,
      roles: ["admin", "teacher", "student", "parent"],
      exact: false,
      badge: undefined
    },
    {
      name: "Resources",
      href: "/resources",
      icon: BookOpen,
      roles: ["admin", "teacher", "student", "parent"],
      exact: false,
      badge: undefined
    },
  ];

  const allItems = [...baseItems, ...adminItems, ...attendanceItems, ...examItems, ...progressItems, ...paymentItems, ...communicationItems];
  
  // Only show items the user can access
  return allItems.filter(item => role && Array.isArray(item.roles) && item.roles.includes(role));
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
  const { logout, isAuthenticated } = useAuth();
  const sidebarRef = React.useRef<HTMLElement>(null);
  
  const navigationItems = getNavigationItems(role);
  const settingsItems = getSettingsItems(role);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location === href;
    }
    return location.startsWith(href + '/') || location === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
    }
    setLocation('/login');
  };

  // Click outside to collapse sidebar (for mobile/small screens)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 768 && !isCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCollapsed, setIsCollapsed]);

  return (
    <>
      {/* Only show overlay and collapse on mobile screens */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => {
            if (window.innerWidth < 768) setIsCollapsed(true);
          }}
          aria-label="Close sidebar overlay"
        />
      )}
      <aside ref={sidebarRef} className={cn("bg-card shadow-lg border-r border-border flex flex-col h-full fixed md:relative z-50 transition-all duration-300", {
        "w-60": !isCollapsed,
        "w-20": isCollapsed,
      }, className)}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer group"
            onClick={() => {
              if (window.innerWidth >= 768) setIsCollapsed(!isCollapsed);
            }}
            tabIndex={0}
            role="button"
            aria-label="Toggle sidebar"
          >
            <div className="w-20 h-20 sm:w-14 sm:h-14 flex items-center justify-center">
              <img src="/src/assets/ohman-no-bg.png" alt="OhmanFoundations Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-base font-bold tracking-tight text-primary select-none leading-tight">
                Ohman<br />Foundations
              </span>
            )}
            {/* Mobile close chevron */}
            <button
              type="button"
              className="ml-2 md:hidden flex items-center justify-center"
              onClick={() => setIsCollapsed(true)}
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24 modern-scrollbar">
          <nav className="px-2 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    { "justify-center": isCollapsed },
                    isActive(item.href, item.exact)
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
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
        </div>
        {/* Bottom section with settings and logout (fixed at bottom, always visible above scroll) */}
        <div className="w-full border-t border-border p-2 absolute bottom-0 left-0 bg-card">
          {settingsItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                { "justify-center": isCollapsed },
                isActive(item.href)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
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
    </>
  );
}