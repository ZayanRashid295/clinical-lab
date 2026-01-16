"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/shared/ui/button";
import { Stethoscope, Trophy, Sun, Moon, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { LeaderboardTable } from "./LeaderboardTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface LandingNavProps {
  onLoginClick?: () => void;
}

export function LandingNav({ onLoginClick }: LandingNavProps) {
  const router = useRouter();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { config, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Check authentication status and get user info
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          const profile = await authService.getProfile();
          const name = profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : profile?.email?.split('@')[0] || 'User';
          setUserName(name);
        } catch (error) {
          setUserName(null);
        }
      } else {
        setUserName(null);
      }
    };
    checkAuth();
    
    // Listen for storage changes (when login happens in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to auth-related storage changes
      if (e.key === 'authToken' || e.key === 'userData') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case login happens in same window (every 2 seconds to reduce load)
    const interval = setInterval(checkAuth, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = config.theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Navigate to login page in Next.js
      window.location.href = "/login";
    }
  };

  const handleSignup = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Navigate to login page in Next.js
      window.location.href = "/login";
    }
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const globalEntries = [
    {
      rank: 1,
      name: "Sarah Chen",
      specialty: "Internal Medicine",
      eloRating: 1845,
      casesCompleted: 127,
    },
    {
      rank: 2,
      name: "Michael Rodriguez",
      specialty: "Emergency Med",
      eloRating: 1823,
      casesCompleted: 115,
    },
    {
      rank: 3,
      name: "Emily Johnson",
      specialty: "Pediatrics",
      eloRating: 1801,
      casesCompleted: 98,
    },
    {
      rank: 4,
      name: "David Kim",
      specialty: "Surgery",
      eloRating: 1798,
      casesCompleted: 105,
    },
    {
      rank: 5,
      name: "Jessica Martinez",
      specialty: "Internal Medicine",
      eloRating: 1776,
      casesCompleted: 92,
    },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Clinical Lab
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeaderboardOpen(true)}
              data-testid="button-leaderboard"
            >
              <Trophy className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              title={
                mounted && config.theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {mounted && config.theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {userName || "User"}
                </span>
                <Button
                  onClick={handleDashboard}
                  data-testid="button-dashboard"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  data-testid="button-login"
                >
                  Log In
                </Button>
                <Button onClick={handleSignup} data-testid="button-signup">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-500" />
              Leaderboard
            </DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="global"
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList>
              <TabsTrigger value="global" data-testid="tab-global">
                Global
              </TabsTrigger>
              <TabsTrigger value="cohort" data-testid="tab-cohort">
                My Cohort
              </TabsTrigger>
              <TabsTrigger value="specialty" data-testid="tab-specialty">
                By Specialty
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="global" className="m-0">
                <LeaderboardTable entries={globalEntries} />
              </TabsContent>

              <TabsContent value="cohort" className="m-0">
                <LeaderboardTable entries={globalEntries.slice(0, 3)} />
              </TabsContent>

              <TabsContent value="specialty" className="m-0">
                <LeaderboardTable entries={globalEntries.slice(0, 3)} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
