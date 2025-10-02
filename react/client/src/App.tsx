import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import TestLogout from "@/pages/TestLogout";
import CasesPage from "@/pages/CasesPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import AchievementsPage from "@/pages/AchievementsPage";
import ProgressPage from "@/pages/ProgressPage";
import CaseSession from "@/pages/CaseSession";
import FacultyDashboard from "@/pages/FacultyDashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/test-logout" component={TestLogout} />
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" component={ProgressPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/cases" component={CasesPage} />
          <Route path="/case/:id" component={CaseSession} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/achievements" component={AchievementsPage} />
          <Route path="/faculty/dashboard" component={FacultyDashboard} />
        </>
      ) : null}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
