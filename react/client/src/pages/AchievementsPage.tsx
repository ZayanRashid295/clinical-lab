import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Heart, Brain, Activity, Stethoscope, TrendingUp, Award } from "lucide-react";

export default function AchievementsPage() {
  const achievements = [
    { icon: Heart, title: "Sepsis Bundle Hero", description: "Successfully managed 10 sepsis cases following evidence-based guidelines", unlocked: true },
    { icon: Brain, title: "Diagnostic Master", description: "Achieved 95%+ accuracy on 20 consecutive cases", unlocked: true },
    { icon: Activity, title: "ECG Interpreter", description: "Correctly interpret 50 ECGs", unlocked: false },
    { icon: Stethoscope, title: "Thorough Historian", description: "Complete comprehensive history in 15 cases", unlocked: true },
    { icon: TrendingUp, title: "Rising Star", description: "Gain 100 Elo points in one week", unlocked: false },
    { icon: Award, title: "Perfect Score", description: "Score 100% on an Advanced case", unlocked: false },
  ];

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
                <h1 className="text-3xl font-bold mb-2">Achievements</h1>
                <p className="text-muted-foreground">Track your progress and unlock badges</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement, idx) => (
                  <AchievementBadge key={idx} {...achievement} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
