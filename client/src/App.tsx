import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Exams from "@/pages/exams";
import Payments from "@/pages/payments";
import Messages from "@/pages/messages";
import Resources from "@/pages/resources";
import Settings from "@/pages/settings";
import { useState } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:block" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 lg:hidden">
          <div className="fixed left-0 top-0 h-full w-64 transform transition-transform duration-300">
            <Sidebar />
            <button
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted z-10"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-mobile-nav"
            >
              <span className="sr-only">Close sidebar</span>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/students" component={Students} />
          <Route path="/exams" component={Exams} />
          <Route path="/progress" component={() => <div className="p-6">Progress page coming soon...</div>} />
          <Route path="/payments" component={Payments} />
          <Route path="/messages" component={Messages} />
          <Route path="/resources" component={Resources} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
