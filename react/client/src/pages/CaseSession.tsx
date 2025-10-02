import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClinicalInterviewPanel } from "@/components/ClinicalInterviewPanel";
import { ShadowModePanel } from "@/components/ShadowModePanel";
import { RubricScorecard } from "@/components/RubricScorecard";
import { TimelineEvent } from "@/components/TimelineEvent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function CaseSession() {
  const [mode, setMode] = useState<"shadow" | "interview" | "review">("shadow");

  const rubricCategories = [
    { name: "History Taking", score: 18, maxScore: 20 },
    { name: "Physical Examination", score: 15, maxScore: 20 },
    { name: "Investigations", score: 16, maxScore: 20 },
    { name: "Management", score: 14, maxScore: 20 },
    { name: "Documentation", score: 17, maxScore: 20 },
    { name: "Communication", score: 19, maxScore: 20 },
  ];

  const timelineEvents = [
    { action: "Obtained patient history", timestamp: "2 min", status: "correct" as const, feedback: "Comprehensive history with appropriate follow-up questions" },
    { action: "Ordered chest X-ray", timestamp: "5 min", status: "correct" as const, feedback: "Appropriate imaging for suspected pneumonia" },
    { action: "Ordered full body CT scan", timestamp: "6 min", status: "incorrect" as const, feedback: "Unnecessary imaging - targeted approach recommended", isLast: true },
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
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cases
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-2">
                <Button 
                  variant={mode === "shadow" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("shadow")}
                  data-testid="button-mode-shadow"
                >
                  Shadow Mode
                </Button>
                <Button 
                  variant={mode === "interview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("interview")}
                  data-testid="button-mode-interview"
                >
                  Interview Mode
                </Button>
                <Button 
                  variant={mode === "review" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("review")}
                  data-testid="button-mode-review"
                >
                  Review
                </Button>
              </div>
              <ThemeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-hidden">
            {mode === "shadow" && <ShadowModePanel />}
            {mode === "interview" && <ClinicalInterviewPanel />}
            {mode === "review" && (
              <div className="h-full overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Case Review: Acute Chest Pain</h1>
                    <p className="text-muted-foreground">Review your performance and learn from feedback</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-xl font-bold mb-4">Your Score</h2>
                      <RubricScorecard categories={rubricCategories} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-4">Timeline Review</h2>
                      <div className="border rounded-lg p-6">
                        <ScrollArea className="h-[400px]">
                          {timelineEvents.map((event, idx) => (
                            <TimelineEvent key={idx} {...event} />
                          ))}
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
