"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/shared/ui/button";
import { Stethoscope, Trophy, Sun, Moon, LayoutDashboard, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/shared";
import { CategoriesService } from "@/app/services/categories/categories.service";
import { Category } from "@/app/types/category";
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
  /** Opens the auth modal on the sign-up tab (creates a user via API). */
  onSignupClick?: () => void;
}

export function LandingNav({ onLoginClick, onSignupClick }: LandingNavProps) {
  const router = useRouter();
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
    
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const service = new CategoriesService();
        const data = await service.getCategoriesPublic();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
    
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
      void router.push("/auth");
    }
  };

  const handleSignup = () => {
    if (onSignupClick) {
      onSignupClick();
    } else if (onLoginClick) {
      onLoginClick();
    } else {
      void router.push("/auth?mode=signup");
    }
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  const handleProductClick = (productId: string) => {
    if (isAuthenticated) {
      router.push(`/dashboard`);
    } else {
      handleLogin();
    }
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

        {/* Secondary Navigation - Categories */}
        {categories.length > 0 && (
          <div className="w-full bg-gray-900 border-t border-gray-800 relative z-40">
            <div className="max-w-7xl mx-auto px-6 min-h-[48px] flex flex-wrap items-center gap-1 md:gap-4 relative overflow-visible">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="relative group py-2 flex items-center"
                  onMouseEnter={() => setActiveDropdown(cat.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap">
                    {cat.icon && <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                    {cat.products && cat.products.length > 0 && (
                      <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>

                 {/* Dropdown Menu */}
                 {cat.products && cat.products.length > 0 && activeDropdown === cat.id && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-white dark:bg-gray-800 border-t border-l border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                      <div className="relative bg-white dark:bg-gray-800 z-10 px-2 flex flex-col gap-1 max-h-96 overflow-y-auto">
                        {cat.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors"
                          >
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {product.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
