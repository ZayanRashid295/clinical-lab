import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatCard } from "@/components/StatCard";
import { BookOpen, Trophy, Target, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  
  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Student';

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role="student" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
                <p className="text-muted-foreground">Continue your medical education journey</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Cases Completed"
                  value={47}
                  icon={BookOpen}
                  trend={{ value: 12, label: "this month" }}
                />
                <StatCard
                  title="Elo Rating"
                  value={1823}
                  icon={Trophy}
                  trend={{ value: 5, label: "this week" }}
                />
                <StatCard
                  title="Avg Score"
                  value="85%"
                  icon={Target}
                />
                <StatCard
                  title="Study Time"
                  value="24h"
                  icon={Clock}
                  trend={{ value: 8, label: "this week" }}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
