import { useState, useRef } from "react";
import { Search, Bell, Menu, RefreshCw, User, Book, FileText, CheckCheck, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { Link, useLocation } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { GoBackButton } from "@/components/ui/go-back-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopNavProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  isLoading?: boolean;
  showGoBackButton?: boolean;
}

function NotificationsDropdown() {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
    const [, setLocation] = useLocation();

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) markAsRead(notification.$id);
        if (notification.link) setLocation(notification.link);
    };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">{unreadCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm px-2">Notifications</h4>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}><CheckCheck className="mr-2 h-4 w-4" />Mark all as read</Button>}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setLocation('/notifications')}>View All</Button>
        </div>
        <div className="max-h-96 overflow-y-auto modern-scrollbar">{isLoading ? <p className="p-4 text-sm text-center">Loading...</p> : !notifications || notifications.length === 0 ? <p className="p-4 text-sm text-center text-muted-foreground">No notifications.</p> : notifications.map(n => (<div key={n.$id} onClick={() => handleNotificationClick(n)} className={cn("p-3 border-b hover:bg-muted/50 cursor-pointer", !n.isRead && "bg-blue-500/10")}> <p className="text-sm">{n.message}</p> <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.$createdAt))} ago</p></div>))}</div>
      </PopoverContent>
    </Popover>
  );
}

function UserNav() {
    const { user, logout } = useAuth();
    const [, setLocation] = useLocation();

    const handleLogout = async () => {
        await logout();
        setLocation('/login');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name === 'Admin User' ? 'Administrator' : (user?.name || 'User')}&background=random`} />
                        <AvatarFallback>{user?.name === 'Admin User' ? 'A' : (user?.name?.[0] || 'U')}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name === 'Admin User' ? 'Administrator' : (user?.name || 'User')}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')}><User className="mr-2 h-4 w-4" /><span>Profile</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}><Settings className="mr-2 h-4 w-4" /><span>Settings</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Log out</span></DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


export function TopNav({ title, subtitle, onToggleSidebar, isLoading, showGoBackButton = false }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { results, isLoading: isSearching } = useGlobalSearch(debouncedSearchQuery);
  const [, setLocation] = useLocation();

  const handleResultClick = (url: string) => {
    setLocation(url);
    setSearchQuery("");
  };

  const hasResults = results && (results.students.length > 0 || results.teachers.length > 0 || results.exams.length > 0);
  const showPopover = searchQuery.length >= 3;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="bg-card border-b border-border py-3 sm:py-4 px-2 w-full">
  <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {onToggleSidebar && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {showGoBackButton && <GoBackButton />}
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">{title}</h2>
            {subtitle && (<p className="text-muted-foreground text-xs sm:text-sm hidden md:block">{subtitle}</p>)}
          </div>
           {isLoading && <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  className="w-40 sm:w-48 lg:w-64 pl-10 bg-muted"
                  value={searchQuery}
                  onFocus={() => setPopoverOpen(searchQuery.length >= 3)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPopoverOpen(e.target.value.length >= 3);
                  }}
                />
                {isSearching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              onOpenAutoFocus={() => {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 0);
              }}
            >
              <Command>
                <CommandList>
                  {hasResults ? null : <CommandEmpty>No results found.</CommandEmpty>}
                  {Array.isArray(results?.students) && results.students.length > 0 && (
                    <CommandGroup heading="Students">
                      {results.students.map((s: any) => (
                        <CommandItem key={s.$id} onSelect={() => handleResultClick(`/students/${s.$id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          <span>{s.firstName} {s.lastName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {Array.isArray(results?.teachers) && results.teachers.length > 0 && (
                    <CommandGroup heading="Teachers">
                      {results.teachers.map((t: any) => (
                        <CommandItem key={t.$id} onSelect={() => handleResultClick(`/teachers/${t.$id}`)}>
                          <User className="mr-2 h-4 w-4" />
                          <span>{t.firstName} {t.lastName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {Array.isArray(results?.exams) && results.exams.length > 0 && (
                    <CommandGroup heading="Exams">
                      {results.exams.map((e: any) => (
                        <CommandItem key={e.$id} onSelect={() => handleResultClick(`/exams/${e.$id}`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{e.title}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <NotificationsDropdown />
          <UserNav />
        </div>
      </div>
    </header>
  );
}