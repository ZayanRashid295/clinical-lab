import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
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

// Component to handle redirects based on authentication
function AuthRedirect() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated()) {
      // If not authenticated and on a protected route, redirect to landing page
      const protectedRoutes = [
        "/dashboard",
        "/progress",
        "/cases",
        "/leaderboard",
        "/achievements",
        "/faculty/dashboard",
      ];
      if (protectedRoutes.some((route) => location.startsWith(route))) {
        console.log(
          "🔄 Redirecting unauthenticated user from",
          location,
          "to /"
        );
        setLocation("/");
      }
    } else {
      // If authenticated and on root, redirect to dashboard
      if (location === "/") {
        console.log("🔄 Redirecting authenticated user from / to /dashboard");
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, location, setLocation]);

  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log("🚦 Router state:", {
    isLoading,
    isAuthenticated: isAuthenticated(),
    currentPath: window.location.pathname,
  });

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
    <>
      <AuthRedirect />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/test-logout" component={TestLogout} />
        <Route path="/dashboard" component={ProgressPage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/cases" component={CasesPage} />
        <Route path="/case/:id" component={CaseSession} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/achievements" component={AchievementsPage} />
        <Route path="/faculty/dashboard" component={FacultyDashboard} />
        <Route component={NotFound} />
      </Switch>
    </>
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
