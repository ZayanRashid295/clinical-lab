import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import CreateTest from "@/pages/CreateTest";
import PreviousTests from "@/pages/PreviousTests";
import Performance from "@/pages/Performance";
import Notebook from "@/pages/Notebook";
import StudyPlanner from "@/pages/StudyPlanner";
import MedicalLibrary from "@/pages/MedicalLibrary";
import Search from "@/pages/Search";
import Notes from "@/pages/Notes";
import Flashcards from "@/pages/Flashcards";
import TestSession from "@/pages/TestSession";
import TestResults from "@/pages/TestResults";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/study-planner" component={StudyPlanner} />
      <Route path="/medical-library" component={MedicalLibrary} />
      <Route path="/create-test" component={CreateTest} />
      <Route path="/previous-tests" component={PreviousTests} />
      <Route path="/performance" component={Performance} />
      <Route path="/search" component={Search} />
      <Route path="/notes" component={Notes} />
      <Route path="/notebook" component={Notebook} />
      <Route path="/flashcards" component={Flashcards} />
      <Route path="/test-session/:id" component={TestSession} />
      <Route path="/test-results/:id" component={TestResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b border-border bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6 bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
