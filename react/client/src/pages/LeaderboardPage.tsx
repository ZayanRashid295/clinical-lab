import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LeaderboardPage() {
  const globalEntries = [
    { rank: 1, name: "Sarah Chen", specialty: "Internal Medicine", eloRating: 1845, casesCompleted: 127 },
    { rank: 2, name: "Michael Rodriguez", specialty: "Emergency Med", eloRating: 1823, casesCompleted: 115 },
    { rank: 3, name: "Emily Johnson", specialty: "Pediatrics", eloRating: 1801, casesCompleted: 98 },
    { rank: 4, name: "David Kim", specialty: "Surgery", eloRating: 1798, casesCompleted: 105 },
    { rank: 5, name: "Jessica Martinez", specialty: "Internal Medicine", eloRating: 1776, casesCompleted: 92 },
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
                <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                <p className="text-muted-foreground">Compete with peers and track your ranking</p>
              </div>

              <Tabs defaultValue="global">
                <TabsList>
                  <TabsTrigger value="global" data-testid="tab-global">Global</TabsTrigger>
                  <TabsTrigger value="cohort" data-testid="tab-cohort">My Cohort</TabsTrigger>
                  <TabsTrigger value="specialty" data-testid="tab-specialty">By Specialty</TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="mt-6">
                  <LeaderboardTable entries={globalEntries} />
                </TabsContent>

                <TabsContent value="cohort" className="mt-6">
                  <LeaderboardTable entries={globalEntries.slice(0, 3)} />
                </TabsContent>

                <TabsContent value="specialty" className="mt-6">
                  <LeaderboardTable entries={globalEntries.slice(0, 3)} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
